import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Id} from '../../../../common/types/types';
import {DebtsStatus} from '../../models/debts-status.enum';
import {DebtInterface} from '../../models/debt.interface';
import {UserInterface} from '../../../users/models/user.interface';
import {CloneRealUserToVirtualDto} from '../../../users/models/user.dto';
import {validate} from 'class-validator';
import {DebtsAccountType} from '../../models/debts-account-type.enum';
import {OperationInterface} from '../../../operations/models/operation.interface';
import {OperationStatus} from '../../../operations/models/operation-status.enum';
import {DebtDto} from '../../models/debt.dto';
import {Model} from 'mongoose';
import {UserCollectionRef} from '../../../users/models/user-collection-ref';
import {OperationsCollectionRef} from '../../../operations/models/operation-collection-ref';
import {DebtsCollectionRef} from '../../models/debts-collection-ref';

@Injectable()
export class DebtsMultipleService {
    constructor(
        @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>,
        @InjectModel(DebtsCollectionRef) private readonly Debts: Model<DebtInterface>,
        @InjectModel(OperationsCollectionRef) private readonly Operation: Model<OperationInterface>
    ) {}



    async createMultipleDebt(creatorId: Id, userId: Id, currency: string): Promise<DebtInterface> {
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
            .findOne({'users': {'$all': [userId, creatorId]}})
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

    async deleteMultipleDebts(debt: DebtInterface, userId: Id): Promise<void> {
        const deletedUserInfo = debt.users.find(user => user['_id'].toString() === userId.toString());

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


        updatedDebt.statusAcceptor = updatedDebt.users.find(user => user.toString() !== userId.toString());
        updatedDebt.users.push(createdVirtualUser._id);

        const promises: Promise<OperationInterface>[] = [];
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
}
