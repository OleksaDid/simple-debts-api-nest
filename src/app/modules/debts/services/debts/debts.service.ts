import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {UserInterface} from '../../../users/models/user.interface';
import {Id} from '../../../../common/types/types';
import {DebtInterface} from '../../models/debt.interface';
import {DebtsListDto} from '../../models/debt.dto';
import {DebtsAccountType} from '../../models/debts-account-type.enum';
import {SendUserDto} from '../../../users/models/user.dto';
import {DebtsStatus} from '../../models/debts-status.enum';
import {OperationInterface} from '../../../operations/models/operation.interface';
import {DebtResponseDto} from '../../models/debt-response.dto';
import {OperationResponseDto} from '../../../operations/models/operation-response.dto';
import {DebtsMultipleService} from '../debts-multiple/debts-multiple.service';
import {DebtsSingleService} from '../debts-single/debts-single.service';
import {UserCollectionRef} from '../../../users/models/user-collection-ref';
import {DebtsCollectionRef} from '../../models/debts-collection-ref';
import {OperationsCollectionRef} from '../../../operations/models/operation-collection-ref';

@Injectable()
export class DebtsService {


  constructor(
      @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>,
      @InjectModel(DebtsCollectionRef) private readonly Debts: Model<DebtInterface>,
      @InjectModel(OperationsCollectionRef) private readonly Operation: Model<OperationInterface>,
      private readonly multipleDebtsService: DebtsMultipleService,
      private readonly singleDebtsService: DebtsSingleService
  ) {}



  async getAllUserDebts(userId: Id): Promise<DebtsListDto> {
      const debts = await this.Debts
          .find({
              $or: [
                  {users: {'$all': [userId]}},
                  {status: DebtsStatus.CONNECT_USER, statusAcceptor: userId}
              ]
          })
          .populate({ path: 'users', select: 'name picture virtual'})
          .sort({status: 1, updatedAt: -1});

      return new DebtsListDto(
          debts.map(debt => this.formatDebt(debt, userId, false)),
          userId
      );
  }

  async getDebtsById(userId: Id, debtsId: Id) {
      const debt = await this.Debts
          .findById(debtsId)
          .populate({
              path: 'moneyOperations',
              select: 'date moneyAmount moneyReceiver description status statusAcceptor',
              options: { sort: { 'date': -1 } }
          })
          .populate({ path: 'users', select: 'name picture virtual'});

      if(!debt) {
          throw new HttpException('Debts with id ' + debtsId + ' is not found', HttpStatus.BAD_REQUEST);
      }

      return this.formatDebt(debt, userId, true);
  };

  async deleteDebt(userId: Id, debtsId: Id): Promise<DebtsAccountType> {
    let debt: DebtInterface;

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


      if(debt.type === DebtsAccountType.SINGLE_USER) {
          await this.singleDebtsService.deleteSingleDebt(debt, userId);
      } else if(debt.type === DebtsAccountType.MULTIPLE_USERS) {
          await this.multipleDebtsService.deleteMultipleDebts(debt, userId);
      }

      return debt.type;
  };




  private formatDebt(debt: DebtInterface, userId: Id, saveOperations: boolean) {
      // make preview for user connect
      if(debt.status === DebtsStatus.CONNECT_USER && debt.statusAcceptor === userId) {
          const userToChange = debt.users.find(user => user['virtual']);

          debt = JSON.parse(JSON.stringify(debt).replace(userToChange['_id'].toString(), userId.toString()));
      }

      const user: any = debt.users.find(user => user['_id'].toString() != userId);

      let operations = [];

      if(saveOperations) {
          operations = debt.moneyOperations
              .map(operation => new OperationResponseDto(
                  operation._id,
                  operation.date,
                  operation.moneyAmount,
                  operation.moneyReceiver,
                  operation.description,
                  operation.status,
                  operation.statusAcceptor
              ));
      }

      return new DebtResponseDto(
          debt._id,
          new SendUserDto(user._id, user.name, user.picture),
          debt.type,
          debt.currency,
          debt.status,
          debt.statusAcceptor,
          debt.summary,
          debt.moneyReceiver,
          operations
      );
  }
}
