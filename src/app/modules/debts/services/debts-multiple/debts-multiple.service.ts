import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Id} from '../../../../common/types/types';
import {DebtsStatus} from '../../models/debts-status.enum';
import {CloneRealUserToVirtualDto, SendUserDto} from '../../../users/models/user.dto';
import {validate} from 'class-validator';
import {DebtsAccountType} from '../../models/debts-account-type.enum';
import {OperationStatus} from '../../../operations/models/operation-status.enum';
import {DebtDto} from '../../models/debt.dto';
import {InjectModel} from 'nestjs-typegoose';
import {InstanceType, ModelType} from 'typegoose';
import {Operation} from '../../../operations/models/operation';
import {Debt} from '../../models/debt';
import {User} from '../../../users/models/user';
import {DebtsHelper} from '../../models/debts.helper';
import {NotificationsService} from '../../../firebase/services/notifications.service';

@Injectable()
export class DebtsMultipleService {
  constructor(
    @InjectModel(User) private readonly User: ModelType<User>,
    @InjectModel(Debt) private readonly Debts: ModelType<Debt>,
    @InjectModel(Operation) private readonly Operation: ModelType<Operation>,
    private _notificationsService: NotificationsService
  ) {}



  async createMultipleDebt(creator: SendUserDto, userId: Id, currency: string): Promise<InstanceType<Debt>> {
    try {
      const userToCreateDebtWith = await this.User
        .findById(userId)
        .exec();

      if(!userToCreateDebtWith) {
        throw 'User is not found';
      }
    } catch(err) {
      throw new HttpException('User is not found', HttpStatus.BAD_REQUEST);
    }

    const debts = await this.Debts
      .findOne({
        users: {'$all': [userId, creator.id]},
        currency
      })
      .exec();


    if(debts) {
      throw new HttpException('Such debts object is already created', HttpStatus.BAD_REQUEST);
    }

    const newDebtsPayload = new DebtDto(creator.id, userId, DebtsAccountType.MULTIPLE_USERS, currency);

    const errors = await validate(newDebtsPayload);

    if(errors && errors.length > 0) {
      throw new HttpException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
    }

    const newDebt = await this.Debts.create(newDebtsPayload);

    this._notificationsService.sendDebtNotification(
      newDebt,
      creator.id,
      `Debt invitation`,
      `${creator.name} has invited you to join ${newDebt.currency} debt`
    );

    return newDebt;
  }

  async deleteMultipleDebts(debt: InstanceType<Debt>, user: SendUserDto): Promise<void> {
    const deletedUserInfo = DebtsHelper.getCurrentDebtUserModel(debt, user.id);

    const virtualUserPayload = new CloneRealUserToVirtualDto(deletedUserInfo.name, deletedUserInfo.picture);

    const errors = await validate(virtualUserPayload);

    if(errors && errors.length > 0) {
      throw new HttpException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
    }

    const createdVirtualUser = await this.User.create(virtualUserPayload);

    const updatedDebt = await this.Debts
      .findByIdAndUpdate(debt.id, {
        type: DebtsAccountType.SINGLE_USER,
        status: DebtsStatus.USER_DELETED,
        $pull: {'users': user.id}
      });


    updatedDebt.statusAcceptor = DebtsHelper.getAnotherDebtUserId(updatedDebt, user.id);
    updatedDebt.users.push(createdVirtualUser._id);

    const promises: Promise<InstanceType<Operation>>[] = [];
    updatedDebt.moneyOperations
      .forEach(operationId => promises.push(this.Operation.findById(operationId).then(op => op)));

    await updatedDebt.save();

    const operations = await Promise.all(promises);

    const operationPromises = operations.map(operation => {
      if(operation.moneyReceiver && operation.moneyReceiver.toString() === user.id.toString()) {
        operation.moneyReceiver = createdVirtualUser._id;
      }
      if(operation.statusAcceptor && operation.statusAcceptor.toString() === user.id.toString()) {
        operation.statusAcceptor = null;
        operation.status = OperationStatus.UNCHANGED;
      }
      return operation.save();
    });

    await Promise.all(operationPromises);

    this._notificationsService.sendDebtNotification(
      debt,
      user.id,
      `Operations accepted`,
      `${user.name} has accepted all operations in ${debt.currency} debt`
    );
  }

  async acceptDebtsCreation(user: SendUserDto, debtsId: Id): Promise<void> {
    const debt = await this.Debts
      .findOneAndUpdate(
        { _id: debtsId, status: DebtsStatus.CREATION_AWAITING, statusAcceptor: user.id },
        { status: DebtsStatus.UNCHANGED, statusAcceptor: null }
      );

    if(!debt) {
      throw new HttpException('Debts not found', HttpStatus.BAD_REQUEST);
    }

    this._notificationsService.sendDebtNotification(
      debt,
      user.id,
      `Friend has left the debt`,
      `${user.name} has left the ${debt.currency} debt`
    );
  };

  async declineDebtsCreation(user: SendUserDto, debtsId: Id): Promise<void> {
    const debt = await this.Debts
      .findOneAndRemove({
        _id: debtsId,
        status: DebtsStatus.CREATION_AWAITING,
        users: {$in: [user.id]}
      });

    if(!debt) {
      throw new HttpException('Debts not found', HttpStatus.BAD_REQUEST);
    }

    this._notificationsService.sendDebtNotification(
      debt,
      user.id,
      `Debt declined`,
      `${user.name} refused to join ${debt.currency} debt`
    );
  };

  async acceptAllDebtOperations(user: SendUserDto, debtsId: Id): Promise<void> {

    const debt = await this.Debts.findOne({
      _id: debtsId,
      type: DebtsAccountType.MULTIPLE_USERS
    }).exec();

    if(!debt) {
      throw new HttpException('Debt is not found', HttpStatus.BAD_REQUEST)
    }

    if(debt.status === DebtsStatus.UNCHANGED) {
      return;
    }

    if(
      debt.status === DebtsStatus.CHANGE_AWAITING &&
      debt.statusAcceptor.toString() !== user.id.toString()
    ) {
      throw new HttpException('You are not status acceptor', HttpStatus.BAD_REQUEST)
    }

    if(
      debt.status === DebtsStatus.CHANGE_AWAITING &&
      debt.statusAcceptor.toString() === user.id.toString()
    ) {
      await this.Operation.updateMany({
        debtsId,
        status: OperationStatus.CREATION_AWAITING,
        statusAcceptor: user.id
      }, {
        status: OperationStatus.UNCHANGED,
        statusAcceptor: null
      }).exec();

      debt.statusAcceptor = null;
      debt.status = DebtsStatus.UNCHANGED;

      await debt.calculateSummary();

      this._notificationsService.sendDebtNotification(
        debt,
        user.id,
        `Operations accepted`,
        `${user.name} has accepted all operations in ${debt.currency} debt`
      );
    }
  }
}
