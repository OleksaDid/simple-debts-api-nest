import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {ModelType, InstanceType} from 'typegoose';
import {Id} from '../../../common/types/types';
import {DebtsStatus} from '../../debts/models/debts-status.enum';
import {DebtsAccountType} from '../../debts/models/debts-account-type.enum';
import {OperationStatus} from '../models/operation-status.enum';
import {Debt} from '../../debts/models/debt';
import {Operation} from '../models/operation';
import {InjectModel} from 'nestjs-typegoose';
import {ObjectId} from '../../../common/classes/object-id';
import {DebtsHelper} from '../../debts/models/debts.helper';

@Injectable()
export class OperationsService {


  constructor(
      @InjectModel(Operation) private readonly Operation: ModelType<Operation>,
      @InjectModel(Debt) private readonly Debts: ModelType<Debt>,
  ) {}


  async createOperation(userId: Id, debtsId: Id, moneyAmount: number, moneyReceiver: Id, description: string): Promise<InstanceType<Debt>> {
    let debt: InstanceType<Debt>;

    try {
      debt = await this.Debts
        .findOne(
          {
            _id: debtsId,
            users: {'$all': [userId, moneyReceiver]},
            $nor: [{status: DebtsStatus.CONNECT_USER}, {status: DebtsStatus.CREATION_AWAITING}]
          }
        );

      if(!debt) {
        throw 'Debt wasn\'t found';
      }
    } catch(err) {
      throw new HttpException('Debts wasn\'t found', HttpStatus.BAD_REQUEST);
    }

      const statusAcceptor = DebtsHelper.getAnotherDebtUserId(debt, userId);

      const newOperation = new this.Operation({
        debtsId: debtsId as any,
        moneyAmount,
        moneyReceiver: moneyReceiver as any,
        description,
        status: debt.type === DebtsAccountType.SINGLE_USER ? OperationStatus.UNCHANGED : OperationStatus.CREATION_AWAITING,
        statusAcceptor: debt.type === DebtsAccountType.SINGLE_USER ? null : statusAcceptor,
        date: new Date()
      });

      if(debt.statusAcceptor && debt.statusAcceptor.toString() === userId) {
          throw new HttpException('Cannot modify debts that need acceptance', HttpStatus.BAD_REQUEST);
      }

      await newOperation.save();

      if(debt.type !== DebtsAccountType.SINGLE_USER) {
          debt.statusAcceptor = DebtsHelper.getAnotherDebtUserId(debt, userId);
          debt.status = DebtsStatus.CHANGE_AWAITING;
      }

      debt.moneyOperations.push(newOperation.id);

      await debt.calculateSummary();

      return debt;
  };

  async deleteOperation(userId: Id, operationId: Id): Promise<InstanceType<Debt>> {
    let updatedDebt: InstanceType<Debt>;

    try {
      updatedDebt = await this.Debts
        .findOneAndUpdate(
          {
            users: {'$in': [userId]},
            moneyOperations: {'$in': [operationId]},
            type: DebtsAccountType.SINGLE_USER,
            $nor: [{status: DebtsStatus.CONNECT_USER}, {status: DebtsStatus.CREATION_AWAITING}]
          },
          {
            $pull: {moneyOperations: operationId}
          });

      if(!updatedDebt) {
        throw 'Debt wasn\'t found';
      }
    } catch(err) {
      throw new HttpException('Debt wasn\'t found', HttpStatus.BAD_REQUEST);
    }

    const deletedOperation = await this.Operation.findByIdAndRemove(operationId);

    if(!deletedOperation) {
        throw new HttpException('Operation not found', HttpStatus.BAD_REQUEST);
    }

    await updatedDebt.calculateSummary();

    return updatedDebt;
  };

  async acceptOperation(userId: Id, operationId: Id): Promise<InstanceType<Debt>> {

      const operation = await this.Operation
          .findOneAndUpdate(
              {
                  _id: operationId,
                  statusAcceptor: userId,
                  status: OperationStatus.CREATION_AWAITING
              },
              { status: OperationStatus.UNCHANGED, statusAcceptor: null }
          );


      if(!operation) {
          throw new HttpException('Operation not found', HttpStatus.BAD_REQUEST);
      }

      const debt = await this.Debts
          .findById(operation.debtsId)
          .populate({
              path: 'moneyOperations',
              select: 'status',
          });

      if(debt.moneyOperations.every(operation =>  (operation as Operation).status !== OperationStatus.CREATION_AWAITING)) {
          debt.status = DebtsStatus.UNCHANGED;
          debt.statusAcceptor = null;
      }

      await debt.calculateSummary();

      return debt;
  };

  async declineOperation(userId: Id, operationId: Id): Promise<InstanceType<Debt>> {
      const operation = await this.Operation.findOneAndUpdate(
          {_id: operationId, status: OperationStatus.CREATION_AWAITING},
          {status: OperationStatus.CANCELLED, cancelledBy: userId}
        );

      if(!operation) {
          throw new HttpException('Operation is not found', HttpStatus.BAD_REQUEST);
      }

      const debt: InstanceType<Debt> = await this.Debts
        .findOne({_id: operation.debtsId, users: {$in: [userId]}})
        .populate({
          path: 'moneyOperations',
          select: 'status'
        })
        .exec();

      if(!debt) {
          throw new HttpException('You don\'t have permissions to delete this operation', HttpStatus.BAD_REQUEST);
      }

      if(
          debt.moneyOperations
              .filter(operation => (operation as InstanceType<Operation>)._id.toString() !== operationId)
              .every(operation => (operation as InstanceType<Operation>).status !== OperationStatus.CREATION_AWAITING)
      ) {
          debt.status = DebtsStatus.UNCHANGED;
          debt.statusAcceptor = null;
      }

      await debt.calculateSummary();

      return debt;
  };
}
