import {Component, HttpStatus, Inject} from '@nestjs/common';
import {HttpWithRequestException} from '../../../../services/error-handler/http-with-request.exception';
import {Id} from '../../../../common/types/types';
import {DebtsStatus} from '../../models/debts-status.enum';
import {DebtInterface} from '../../models/debt.interface';
import {UserInterface} from '../../../users/models/user.interface';
import {CloneRealUserToVirtualDto} from '../../../users/models/user.dto';
import {validate} from 'class-validator';
import {DebtsAccountType} from '../../models/debts-account-type.enum';
import {OperationInterface} from '../../../operations/operation.interface';
import {OperationStatus} from '../../../operations/operation-status.enum';
import {DebtDto} from '../../models/debt.dto';
import {Model} from 'mongoose';
import {OperationsProvider} from '../../../operations/operations.providers';
import {DebtsProvider} from '../../debts-providers.enum';
import {UsersProvider} from '../../../users/users-providers.enum';

@Component()
export class DebtsMultipleService {
    constructor(
        @Inject(UsersProvider.UsersModelToken) private readonly User: Model<UserInterface>,
        @Inject(DebtsProvider.DebtsModelToken) private readonly Debts: Model<DebtInterface>,
        @Inject(OperationsProvider.OperationsModelToken) private readonly Operation: Model<OperationInterface>
    ) {}



    async createMultipleDebt(creatorId: Id, userId: Id, countryCode: string): Promise<DebtInterface> {
        return this.User
            .findById(userId)
            .exec()
            .then((user: UserInterface) => {
                if(!user) {
                    throw new HttpWithRequestException('User is not found', HttpStatus.BAD_REQUEST);
                }

                return this.Debts
                    .findOne({'users': {'$all': [userId, creatorId]}})
                    .exec();
            })
            .then((debts: DebtInterface) => {
                if(debts) {
                    throw new HttpWithRequestException('Such debts object is already created', HttpStatus.BAD_REQUEST);
                }

                const newDebts = new DebtDto(creatorId, userId, DebtsAccountType.MULTIPLE_USERS, countryCode);

                return validate(newDebts)
                    .then(errors => {
                        if(!errors) {
                            return this.Debts
                                .create(newDebts)
                                .then((debt: DebtInterface) => debt);
                        } else {
                            throw new HttpWithRequestException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
                        }
                    });
            });
    }

    async deleteMultipleDebts(debt: DebtInterface, userId: Id): Promise<void> {
        const deletedUserInfo = debt.users.find(user => user['_id'].toString() === userId.toString());

        let createdVirtualUser: UserInterface;

        const virtualUserPayload = new CloneRealUserToVirtualDto(deletedUserInfo['name'], deletedUserInfo['picture']);

        const errors = await validate(virtualUserPayload);

        if(errors) {
            throw new HttpWithRequestException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
        }

        return this.User
            .create([virtualUserPayload])
            .then((user: UserInterface[]) => {
                createdVirtualUser = user[0];

                return this.Debts
                    .findByIdAndUpdate(debt.id, {
                        type: DebtsAccountType.SINGLE_USER,
                        status: DebtsStatus.USER_DELETED,
                        $pull: {'users': userId}
                    });
            })
            .then((debt: DebtInterface) => {
                debt.statusAcceptor = debt.users.find(user => user.toString() !== userId.toString());
                debt.users.push(createdVirtualUser._id);

                const promises = [];
                debt['moneyOperations']
                    .forEach(operationId => promises.push(this.Operation.findById(operationId)));

                return debt
                    .save()
                    .then(() => Promise.all(promises));
            })
            .then((operations: OperationInterface[]) => {
                const promises = operations.map(operation => {
                    if(operation.moneyReceiver && operation.moneyReceiver.toString() === userId.toString()) {
                        operation.moneyReceiver = createdVirtualUser._id;
                    }
                    if(operation.statusAcceptor && operation.statusAcceptor.toString() === userId.toString()) {
                        operation.statusAcceptor = null;
                        operation.status = OperationStatus.UNCHANGED;
                    }
                    return operation.save();
                });

                return Promise.all(promises)
                    .then(() => {}); // transform an array of promises into 1 promise
            });
    }

    async acceptDebtsCreation(userId: Id, debtsId: Id): Promise<void> {
        return this.Debts
            .findOneAndUpdate(
                { _id: debtsId, status: DebtsStatus.CREATION_AWAITING, statusAcceptor: userId },
                { status: DebtsStatus.UNCHANGED, statusAcceptor: null }
            )
            .then((debt: DebtInterface) => {
                if(!debt) {
                    throw new HttpWithRequestException('Debts not found', HttpStatus.BAD_REQUEST);
                }
            });
    };

    async declineDebtsCreation(userId: Id, debtsId: Id): Promise<void> {
        return this.Debts
            .findOneAndRemove({
                _id: debtsId,
                status: DebtsStatus.CREATION_AWAITING,
                users: {$in: [userId]}
            })
            .then((debt: DebtInterface) => {
                if(!debt) {
                    throw new HttpWithRequestException('Debts not found', HttpStatus.BAD_REQUEST);
                }
            });
    };
}
