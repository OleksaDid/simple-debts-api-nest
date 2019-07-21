import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DebtsStatus} from '../../models/debts-status.enum';
import {DebtsAccountType} from '../../models/debts-account-type.enum';
import {Id} from '../../../../common/types/types';
import {OperationStatus} from '../../../operations/models/operation-status.enum';
import {DebtDto} from '../../models/debt.dto';
import {validate} from 'class-validator';
import {CreateVirtualUserDto} from '../../../users/models/user.dto';
import {UsersService} from '../../../users/services/users/users.service';
import {InjectModel} from 'nestjs-typegoose';
import {ModelType, InstanceType} from 'typegoose';
import {User} from '../../../users/models/user';
import {Debt} from '../../models/debt';
import {Operation} from '../../../operations/models/operation';
import {ObjectId} from '../../../../common/classes/object-id';
import {DebtsHelper} from '../../models/debts.helper';

@Injectable()
export class DebtsSingleService {
  constructor(
    @InjectModel(User) private readonly User: ModelType<User>,
    @InjectModel(Debt) private readonly Debts: ModelType<Debt>,
    @InjectModel(Operation) private readonly Operation: ModelType<Operation>,
    private _usersService: UsersService
  ) {}



  async createSingleDebt(creatorId: Id, userName: string, currency: string, host: string): Promise<InstanceType<Debt>> {
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
      virtUserModel.picture = await this._usersService.generateUserIdenticon(virtUserModel.id, host);
      await virtUserModel.save();
      userId = virtUserModel._id;
    }

    return this.Debts.create(new DebtDto(creatorId, userId, DebtsAccountType.SINGLE_USER, currency))
  }

  async deleteSingleDebt(debt: InstanceType<Debt>, userId: Id): Promise<void> {
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

  async acceptUserDeletedStatus(userId: Id, debtsId: Id): Promise<InstanceType<Debt>> {
    let debt;

    try {
      debt = await this.Debts
        .findOne({
          _id: debtsId,
          type: DebtsAccountType.SINGLE_USER,
          status: DebtsStatus.USER_DELETED,
          statusAcceptor: userId
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
      debt.statusAcceptor = userId;
    }

    return debt.save();
  };

  async connectUserToSingleDebt(userId: Id, connectUserId: Id, debtsId: Id): Promise<InstanceType<Debt>> {
    const debtsWithConnectingUser = await this.Debts
      .find({users: {$all: [userId, connectUserId]}})
      .exec();

    if(debtsWithConnectingUser && debtsWithConnectingUser.length > 0) {
      throw new HttpException('You already have Debt with this user', HttpStatus.BAD_REQUEST);
    }


    const debt = await this.Debts
      .findOne({_id: debtsId, type: DebtsAccountType.SINGLE_USER, users: {$in: [userId]}});

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
    debt.statusAcceptor = connectUserId as any;

    return debt.save();
  };

  async acceptUserConnectionToSingleDebt(userId: Id, debtsId: Id): Promise<void> {
    let debt;

    try {
      debt = await this.Debts
        .findOne({
          _id: debtsId,
          type: DebtsAccountType.SINGLE_USER,
          status: DebtsStatus.CONNECT_USER,
          statusAcceptor: userId
        })
        .populate('users', 'virtual');

      if(!debt) {
        throw 'Debt wasn\'t found';
      }
    } catch(err) {
      throw new HttpException('Debts wasn\'t found', HttpStatus.BAD_REQUEST);
    }

    const virtualUserId = debt.users.find(user => user['virtual']);

    debt.status = DebtsStatus.UNCHANGED;
    debt.type = DebtsAccountType.MULTIPLE_USERS;
    debt.statusAcceptor = null;

    if(debt.moneyReceiver === virtualUserId) {
      debt.moneyReceiver = userId;
    }

    debt.users.push(userId);

    const promises = [];

    debt.moneyOperations.forEach(operation => {
      promises.push(
        this.Operation
          .findById(operation)
          .then((op: InstanceType<Operation>) => {
            if(op.moneyReceiver === virtualUserId) {
              op.moneyReceiver = new ObjectId(userId);
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
  };

  async declineUserConnectionToSingleDebt(userId: Id, debtsId: Id): Promise<void> {
    const debt = await this.Debts
      .findOneAndUpdate(
        {
          _id: debtsId,
          type: DebtsAccountType.SINGLE_USER,
          status: DebtsStatus.CONNECT_USER,
          $or: [
            {users: {$in: [userId]}},
            {statusAcceptor: userId}
          ]
        },
        {status: DebtsStatus.UNCHANGED, statusAcceptor: null});

    if(!debt) {
      throw new HttpException('Debt is not found', HttpStatus.BAD_REQUEST);
    }
  }
}
