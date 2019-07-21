import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Id} from '../../../../common/types/types';
import {DebtsStatus} from '../../models/debts-status.enum';
import {CloneRealUserToVirtualDto} from '../../../users/models/user.dto';
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

@Injectable()
export class DebtsMultipleService {
  constructor(
    @InjectModel(User) private readonly User: ModelType<User>,
    @InjectModel(Debt) private readonly Debts: ModelType<Debt>,
    @InjectModel(Operation) private readonly Operation: ModelType<Operation>
  ) {}



  async createMultipleDebt(creatorId: Id, userId: Id, currency: string): Promise<InstanceType<Debt>> {
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
        users: {'$all': [userId, creatorId]},
        currency
      })
      .exec();


    if(debts) {
      throw new HttpException('Such debts object is already created', HttpStatus.BAD_REQUEST);
    }

    const newDebtsPayload = new DebtDto(creatorId, userId, DebtsAccountType.MULTIPLE_USERS, currency);

    const errors = await validate(newDebtsPayload);

    if(errors && errors.length > 0) {
      throw new HttpException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
    }

    return this.Debts.create(newDebtsPayload);
  }

  async deleteMultipleDebts(debt: InstanceType<Debt>, userId: Id): Promise<void> {
    const deletedUserInfo = DebtsHelper.getCurrentDebtUserModel(debt, userId);

    const virtualUserPayload = new CloneRealUserToVirtualDto(deletedUserInfo['name'], deletedUserInfo['picture']);

    const errors = await validate(virtualUserPayload);

    if(errors && errors.length > 0) {
      throw new HttpException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
    }

    const createdVirtualUser = await this.User.create(virtualUserPayload);

    const updatedDebt = await this.Debts
      .findByIdAndUpdate(debt.id, {
        type: DebtsAccountType.SINGLE_USER,
        status: DebtsStatus.USER_DELETED,
        $pull: {'users': userId}
      });


    updatedDebt.statusAcceptor = DebtsHelper.getAnotherDebtUserId(updatedDebt, userId);
    updatedDebt.users.push(createdVirtualUser._id);

    const promises: Promise<InstanceType<Operation>>[] = [];
    updatedDebt['moneyOperations']
      .forEach(operationId => promises.push(this.Operation.findById(operationId).then(op => op)));

    await updatedDebt.save();

    const operations = await Promise.all(promises);

    const operationPromises = operations.map(operation => {
      if(operation.moneyReceiver && operation.moneyReceiver.toString() === userId.toString()) {
        operation.moneyReceiver = createdVirtualUser._id;
      }
      if(operation.statusAcceptor && operation.statusAcceptor.toString() === userId.toString()) {
        operation.statusAcceptor = null;
        operation.status = OperationStatus.UNCHANGED;
      }
      return operation.save();
    });

    await Promise.all(operationPromises);
  }

  async acceptDebtsCreation(userId: Id, debtsId: Id): Promise<void> {
    const debt = await this.Debts
      .findOneAndUpdate(
        { _id: debtsId, status: DebtsStatus.CREATION_AWAITING, statusAcceptor: userId },
        { status: DebtsStatus.UNCHANGED, statusAcceptor: null }
      );

    if(!debt) {
      throw new HttpException('Debts not found', HttpStatus.BAD_REQUEST);
    }
  };

  async declineDebtsCreation(userId: Id, debtsId: Id): Promise<void> {
    const debt = await this.Debts
      .findOneAndRemove({
        _id: debtsId,
        status: DebtsStatus.CREATION_AWAITING,
        users: {$in: [userId]}
      });

    if(!debt) {
      throw new HttpException('Debts not found', HttpStatus.BAD_REQUEST);
    }
  };

  async acceptAllDebtOperations(userId: Id, debtsId: Id): Promise<void> {

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
      debt.statusAcceptor.toString() !== userId.toString()
    ) {
      throw new HttpException('You are not status acceptor', HttpStatus.BAD_REQUEST)
    }

    if(
      debt.status === DebtsStatus.CHANGE_AWAITING &&
      debt.statusAcceptor.toString() === userId.toString()
    ) {
      await this.Operation.updateMany({
        debtsId,
        status: OperationStatus.CREATION_AWAITING,
        statusAcceptor: userId
      }, {
        status: OperationStatus.UNCHANGED,
        statusAcceptor: null
      }).exec();

      debt.statusAcceptor = null;
      debt.status = DebtsStatus.UNCHANGED;

      await debt.calculateSummary();
    }
  }
}
