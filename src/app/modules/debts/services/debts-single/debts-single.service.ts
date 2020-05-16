import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DebtsStatus} from '../../models/debts-status.enum';
import {DebtsAccountType} from '../../models/debts-account-type.enum';
import {Id} from '../../../../common/types/types';
import {OperationStatus} from '../../../operations/models/operation-status.enum';
import {DebtDto} from '../../models/debt.dto';
import {validate} from 'class-validator';
import {CreateVirtualUserDto, SendUserDto} from '../../../users/models/user.dto';
import {UsersService} from '../../../users/services/users/users.service';
import {InjectModel} from 'nestjs-typegoose';
import {ModelType, InstanceType} from 'typegoose';
import {User} from '../../../users/models/user';
import {Debt} from '../../models/debt';
import {Operation} from '../../../operations/models/operation';
import {DebtsHelper} from '../../models/debts.helper';
import {NotificationsService} from '../../../firebase/services/notifications.service';

@Injectable()
export class DebtsSingleService {
  constructor(
    @InjectModel(User) private readonly User: ModelType<User>,
    @InjectModel(Debt) private readonly Debts: ModelType<Debt>,
    @InjectModel(Operation) private readonly Operation: ModelType<Operation>,
    private _usersService: UsersService,
    private _notificationsService: NotificationsService
  ) {}



  async createSingleDebt(creatorId: Id, userName: string, currency: string): Promise<InstanceType<Debt>> {
    const virtUser = new CreateVirtualUserDto(userName);

    const errors = await validate(virtUser);

    if(errors && errors.length > 0) {
      throw new HttpException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
    }

    const virtUserModel = new this.User(virtUser);

    const debts = await this.Debts
      .find({'users': {'$all': [creatorId]}, 'type': DebtsAccountType.SINGLE_USER})
      .populate({ path: 'users', select: 'name virtual'});

    let existingVirtUser: User;

    if(debts && debts.length > 0) {
      const debtWithTheSameVirtUser = debts.find(debt => !!debt.users.find(user => (user as User).name === userName && (user as User).virtual));
      existingVirtUser = debtWithTheSameVirtUser
        ? debtWithTheSameVirtUser.users.find(user => (user as User).name === userName && (user as User).virtual) as User
        : null;

      if(
        !!debtWithTheSameVirtUser &&
        debtWithTheSameVirtUser.currency === currency
      ) {
        throw new HttpException('You already have virtual user with such name and currency', HttpStatus.BAD_REQUEST);
      }
    }

    let userId;

    if(existingVirtUser) {
      userId = existingVirtUser._id;
    } else {
      virtUserModel.picture = await this._usersService.generateUserIdenticon(virtUserModel.id);
      await virtUserModel.save();
      userId = virtUserModel._id;
    }

    return this.Debts.create(new DebtDto(creatorId, userId, DebtsAccountType.SINGLE_USER, currency))
  }

  async deleteSingleDebt(debtsId: Id, userId: Id): Promise<void> {
    let debt: InstanceType<Debt>;

    try {
      debt = await this.Debts
        .findOne({_id: debtsId, users: {$in: [userId]}})
        .populate({ path: 'users', select: 'name picture'});

      if(!debt) {
        throw 'Debt not found';
      }
    } catch(err) {
      throw new HttpException('Debt not found', HttpStatus.BAD_REQUEST);
    }

    const virtualUser = DebtsHelper.getAnotherDebtUserModel(debt, userId);

    await debt.remove();

    const debtsWithVirtualUser = await this.Debts.find({
      users: {
        $in: [virtualUser._id]
      }
    });

    if(!debtsWithVirtualUser || debtsWithVirtualUser.length === 0) {
      await this._usersService.deleteUser(virtualUser._id);
    }
  }

  async acceptUserDeletedStatus(user: SendUserDto, debtsId: Id): Promise<void> {
    let debt;

    try {
      debt = await this.Debts
        .findOne({
          _id: debtsId,
          type: DebtsAccountType.SINGLE_USER,
          status: DebtsStatus.USER_DELETED,
          statusAcceptor: user.id
        })
        .populate({
          path: 'moneyOperations',
          select: 'status'
        }).exec();

      if(!debt) {
        throw 'Debt is not found';
      }
    } catch(err) {
      throw new HttpException('Debt is not found', HttpStatus.BAD_REQUEST);
    }

    if(!debt.moneyOperations ||
      !debt.moneyOperations.length ||
      debt.moneyOperations.every(operation => operation.status === OperationStatus.UNCHANGED)
    ) {
      debt.status = DebtsStatus.UNCHANGED;
      debt.statusAcceptor = null;
    } else {
      debt.status = DebtsStatus.CHANGE_AWAITING;
      debt.statusAcceptor = user.id;
    }

    await debt.save();
  };

  async connectUserToSingleDebt(user: SendUserDto, connectUserId: Id, debtsId: Id): Promise<void> {
    const debtsWithConnectingUser = await this.Debts
      .find({users: {$all: [user.id, connectUserId]}})
      .exec();

    if(debtsWithConnectingUser && debtsWithConnectingUser.length > 0) {
      throw new HttpException('You already have Debt with this user', HttpStatus.BAD_REQUEST);
    }


    const debt = await this.Debts
      .findOne({_id: debtsId, type: DebtsAccountType.SINGLE_USER, users: {$in: [user.id]}});

    if(!debt) {
      throw new HttpException('Debt is not found', HttpStatus.BAD_REQUEST);
    }

    if(debt.status === DebtsStatus.CONNECT_USER) {
      throw new HttpException('Some user is already waiting for connection to this Debt', HttpStatus.BAD_REQUEST);
    }

    if(debt.status === DebtsStatus.USER_DELETED) {
      throw new HttpException('You can\'t connect user to this Debt until you resolve user deletion', HttpStatus.BAD_REQUEST);
    }

    debt.status = DebtsStatus.CONNECT_USER;
    debt.connectedUser = connectUserId as any;
    debt.statusAcceptor = connectUserId as any;

    await debt.save();

    this._notificationsService.sendDebtNotification(
      debt,
      user.id,
      `Debt connection request`,
      `${user.name} has invited you to join his debt`
    );
  };

  async acceptUserConnectionToSingleDebt(user: SendUserDto, debtsId: Id): Promise<void> {
    let debt;

    try {
      debt = await this.Debts
        .findOne({
          _id: debtsId,
          type: DebtsAccountType.SINGLE_USER,
          status: DebtsStatus.CONNECT_USER,
          statusAcceptor: user.id
        })
        .populate('users', 'virtual');

      if(!debt) {
        throw 'Debt wasn\'t found';
      }
    } catch(err) {
      throw new HttpException('Debts wasn\'t found', HttpStatus.BAD_REQUEST);
    }

    const virtualUserId = debt.users.find(user => user['virtual'])._id;

    debt.status = DebtsStatus.UNCHANGED;
    debt.type = DebtsAccountType.MULTIPLE_USERS;
    debt.connectedUser = null;
    debt.statusAcceptor = null;

    if(debt.moneyReceiver === virtualUserId) {
      debt.moneyReceiver = user.id;
    }

    debt.users.push(user.id);

    const promises = [];

    debt.moneyOperations.forEach(operation => {
      promises.push(
        this.Operation
          .findById(operation)
          .then((op: InstanceType<Operation>) => {
            if(op.moneyReceiver === virtualUserId) {
              op.moneyReceiver = user.id as any;
            }

            return op.save();
          })
      );
    });

    promises.push(
      this._usersService.deleteUser(virtualUserId)
    );

    promises.push(
      this.Debts
        .findByIdAndUpdate(debtsId, {
          $pull: {users: virtualUserId}
        })
    );

    await debt.save();
    await Promise.all(promises);

    this._notificationsService.sendDebtNotification(
      debt,
      user.id,
      `Debt connection accepted`,
      `${user.name} has accepted your debt connection request`
    );
  };

  async declineUserConnectionToSingleDebt(user: SendUserDto, debtsId: Id): Promise<void> {
    const debt = await this.Debts
      .findOneAndUpdate(
        {
          _id: debtsId,
          type: DebtsAccountType.SINGLE_USER,
          status: DebtsStatus.CONNECT_USER,
          $or: [
            {users: {$in: [user.id]}},
            {statusAcceptor: user.id}
          ]
        },
        {status: DebtsStatus.UNCHANGED, statusAcceptor: null, connectedUser: null});

    if(!debt) {
      throw new HttpException('Debt is not found', HttpStatus.BAD_REQUEST);
    }

    this._notificationsService.sendDebtNotification(
      debt,
      user.id,
      `Debt connection rejected`,
      `${user.name} has rejected your debt connection request`
    );
  }
}
