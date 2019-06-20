import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Id} from '../../../common/types/types';
import {Model, Types} from 'mongoose';
import {OperationInterface} from '../models/operation.interface';
import {DebtInterface} from '../../debts/models/debt.interface';
import {DebtsStatus} from '../../debts/models/debts-status.enum';
import {OperationDto} from '../models/operation.dto';
import {DebtsAccountType} from '../../debts/models/debts-account-type.enum';
import {OperationStatus} from '../models/operation-status.enum';
import {OperationsCollectionRef} from '../models/operation-collection-ref';
import {DebtsCollectionRef} from '../../debts/models/debts-collection-ref';

@Injectable()
export class OperationsService {


  constructor(
      @InjectModel(OperationsCollectionRef) private readonly Operation: Model<OperationInterface>,
      @InjectModel(DebtsCollectionRef) private readonly Debts: Model<DebtInterface>,
  ) {}


  async createOperation(userId: Id, debtsId: Id, moneyAmount: number, moneyReceiver: Id, description: string): Promise<DebtInterface> {
      let debt = await this.Debts
          .findOne(
              {
                  _id: debtsId,
                  users: {'$all': [userId, moneyReceiver]},
                  $nor: [{status: DebtsStatus.CONNECT_USER}, {status: DebtsStatus.CREATION_AWAITING}]
              }
          );


      const statusAcceptor = debt.users.find(user => user.toString() != userId);
      const newOperation = new OperationDto(debtsId, moneyAmount, moneyReceiver, description, statusAcceptor, debt.type);

      if(debt.statusAcceptor && debt.statusAcceptor.toString() === userId) {
          throw new HttpException('Cannot modify debts that need acceptance', HttpStatus.BAD_REQUEST);
      }

      const operation = await this.Operation.create(newOperation);


      if(debt.type !== DebtsAccountType.SINGLE_USER) {
          debt.statusAcceptor = debt.users.find(user => user.toString() != userId);
          debt.status = DebtsStatus.CHANGE_AWAITING;
      } else {
          debt = this.calculateDebtsSummary(debt, moneyReceiver, moneyAmount);
      }

      debt.moneyOperations.push(operation.id);

      await debt.save();

      return debt;
  };

  async deleteOperation(userId: Id, operationId: Id): Promise<DebtInterface> {

      const updatedDebt = await this.Debts
          .findOneAndUpdate(
              {
                  users: {'$in': [userId]},
                  moneyOperations: {'$in': [operationId]},
                  type: DebtsAccountType.SINGLE_USER,
                  $nor: [{status: DebtsStatus.CONNECT_USER}, {status: DebtsStatus.CREATION_AWAITING}]
              },
              {$pull: {moneyOperations: operationId}}
          )
          .populate({
              path: 'moneyOperations',
              select: 'moneyAmount moneyReceiver',
          });


      const deletedOperation = await this.Operation.findByIdAndRemove(operationId);

      if(!deletedOperation) {
          throw new HttpException('Operation not found', HttpStatus.BAD_REQUEST);
      }


      const operation = updatedDebt.moneyOperations.find(op => op.id.toString() === operationId);
      const moneyAmount = operation.moneyAmount;
      const moneyReceiver = updatedDebt.users.find(user => user.toString() !== operation.moneyReceiver);

      await this.calculateDebtsSummary(updatedDebt, moneyReceiver, moneyAmount).save();

      return updatedDebt;
  };

  async acceptOperation(userId: Id, operationId: Id): Promise<DebtInterface> {

      const operation = await this.Operation
          .findOneAndUpdate(
              {
                  _id: operationId,
                  statusAcceptor: new Types.ObjectId(userId),
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

      if(debt.moneyOperations.every(operation => operation.status === OperationStatus.UNCHANGED)) {
          debt.status = DebtsStatus.UNCHANGED;
          debt.statusAcceptor = null;
      }

      await this.calculateDebtsSummary(debt, operation.moneyReceiver, operation.moneyAmount).save();

      return debt;
  };

  async declineOperation(userId: Id, operationId: Id) {
      const operation = await this.Operation.findOne({_id: operationId, status: OperationStatus.CREATION_AWAITING});

      if(!operation) {
          throw new HttpException('Operation is not found', HttpStatus.BAD_REQUEST);
      }

      const debt = await this.Debts
          .findOneAndUpdate(
              {_id: operation.debtsId, users: {$in: [userId]}},
              {'$pull': {'moneyOperations': operationId}}
          )
          .populate({ path: 'moneyOperations', select: 'status'});

      if(!debt) {
          throw new HttpException('You don\'t have permissions to delete this operation', HttpStatus.BAD_REQUEST);
      }

      await this.Operation.findByIdAndRemove(operationId);

      if(
          debt.moneyOperations
              .filter(operation => operation.id.toString() !== operationId)
              .every(operation => operation.status === OperationStatus.UNCHANGED)
      ) {
          debt.status = DebtsStatus.UNCHANGED;
          debt.statusAcceptor = null;
      }

      await debt.save();

      return debt;
  };



  private calculateDebtsSummary(debt: DebtInterface, moneyReceiver: Id, moneyAmount: number) {
      debt.summary +=  debt.moneyReceiver !== null
          ? debt.moneyReceiver.toString() == moneyReceiver.toString()
              ? +moneyAmount
              : -moneyAmount
          : +moneyAmount;

      if(debt.summary === 0) {
          debt.moneyReceiver = null;
      }

      if(debt.summary > 0 && debt.moneyReceiver === null) {
          debt.moneyReceiver = moneyReceiver;
      }

      if(debt.summary < 0) {
          debt.moneyReceiver = moneyReceiver;
          debt.summary += (debt.summary * -2);
      }

      return debt;
  }
}
