import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Id} from '../../../../common/types/types';
import {DebtsListDto} from '../../models/debt.dto';
import {SendUserDto} from '../../../users/models/user.dto';
import {DebtsStatus} from '../../models/debts-status.enum';
import {DebtResponseDto} from '../../models/debt-response.dto';
import {OperationResponseDto} from '../../../operations/models/operation-response.dto';
import {InjectModel} from 'nestjs-typegoose';
import {User} from '../../../users/models/user';
import {Debt} from '../../models/debt';
import {Operation} from '../../../operations/models/operation';
import {ModelType, InstanceType} from 'typegoose';
import {DebtsHelper} from '../../models/debts.helper';

@Injectable()
export class DebtsService {


  constructor(
      @InjectModel(User) private readonly User: ModelType<User>,
      @InjectModel(Debt) private readonly Debts: ModelType<Debt>,
      @InjectModel(Operation) private readonly Operation: ModelType<Operation>,
  ) {}



  async getAllUserDebts(userId: Id): Promise<DebtsListDto> {
      const debts = await this.Debts
          .find({
              $or: [
                  {users: {'$all': [userId]}},
                  {status: DebtsStatus.CONNECT_USER, statusAcceptor: userId}
              ]
          })
          .populate({path: 'connectedUser', select: 'name picture virtual'})
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
          .populate({path: 'connectedUser', select: 'name picture virtual'})
          .populate({ path: 'users', select: 'name picture virtual'});

      if(!debt) {
          throw new HttpException('Debts with id ' + debtsId + ' is not found', HttpStatus.BAD_REQUEST);
      }

      return this.formatDebt(debt, userId, true);
  };




  private formatDebt(debt: InstanceType<Debt>, userId: Id, saveOperations: boolean) {
    // make preview for user connect
    if(debt.status === DebtsStatus.CONNECT_USER && debt.statusAcceptor.toString() === userId) {
        const userToChange = debt.users.find(user => (user as InstanceType<User>).virtual) as InstanceType<User>;

        debt = JSON.parse(JSON.stringify(debt).replace(userToChange._id.toString(), userId.toString()));
    }

    const user = DebtsHelper.getAnotherDebtUserModel(debt, userId);

    let operations = [];

    if(saveOperations) {
        operations = (debt.moneyOperations as Operation[])
            .map(operation => new OperationResponseDto(
              operation._id.toString(),
              operation.date,
              operation.moneyAmount,
              operation.moneyReceiver ? operation.moneyReceiver.toString() : null,
              operation.description,
              operation.status,
              operation.statusAcceptor ? operation.statusAcceptor.toString() : null,
              operation.cancelledBy ? operation.cancelledBy.toString() : null
            ));
    } else {
      operations = null;
    }

    return new DebtResponseDto(
        debt._id,
        new SendUserDto(user._id.toString(), user.name, user.picture),
        debt.type,
        debt.currency,
        debt.status,
        debt.statusAcceptor ? debt.statusAcceptor.toString() : null,
        debt.summary,
        debt.moneyReceiver ? debt.moneyReceiver.toString() : null,
        operations
    );
  }
}
