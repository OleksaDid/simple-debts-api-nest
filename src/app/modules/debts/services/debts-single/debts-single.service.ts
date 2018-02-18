import {Component, HttpStatus, Inject} from '@nestjs/common';
import {HttpWithRequestException} from '../../../../services/error-handler/http-with-request.exception';
import {DebtInterface} from '../../models/debt.interface';
import {DebtsStatus} from '../../models/debts-status.enum';
import {DebtsAccountType} from '../../models/debts-account-type.enum';
import {Id} from '../../../../common/types/types';
import {OperationInterface} from '../../../operations/operation.interface';
import {OperationStatus} from '../../../operations/operation-status.enum';
import {DebtDto} from '../../models/debt.dto';
import {UserInterface} from '../../../users/models/user.interface';
import {validate} from 'class-validator';
import {CreateVirtualUserDto} from '../../../users/models/user.dto';
import {UsersService} from '../../../users/services/users/users.service';
import {Model} from 'mongoose';
import {OperationsProvider} from '../../../operations/operations.providers';
import {DebtsProvider} from '../../debts-providers.enum';
import {UsersProvider} from '../../../users/users-providers.enum';

@Component()
export class DebtsSingleService {
    constructor(
        @Inject(UsersProvider.UsersModelToken) private readonly User: Model<UserInterface>,
        @Inject(DebtsProvider.DebtsModelToken) private readonly Debts: Model<DebtInterface>,
        @Inject(OperationsProvider.OperationsModelToken) private readonly Operation: Model<OperationInterface>,
        private readonly usersService: UsersService
    ) {}



    async createSingleDebt(creatorId: Id, userName: string, countryCode: string, imagesPath: string): Promise<DebtInterface> {
        const virtUser = new CreateVirtualUserDto(userName);

        const errors = await validate(virtUser);

        if(errors) {
            throw new HttpWithRequestException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
        }

        return this.Debts
            .find({'users': {'$all': [creatorId]}, 'type': DebtsAccountType.SINGLE_USER})
            .populate({ path: 'users', select: 'name virtual'})
            .lean()
            .then((debts: DebtInterface[]) => {
                if(
                    debts &&
                    debts.length > 0 &&
                    debts.some(debt => !!debt.users.find(user => user['name'] === userName && user['virtual']))
                ) {
                    throw new HttpWithRequestException('You already have virtual user with such name', HttpStatus.BAD_REQUEST);
                }

                return this.User.create(virtUser);
            })
            .then((user: UserInterface) => {

                const newUser: any = new this.User();

                return newUser
                    .generateIdenticon(user.id)
                    .then(image => {
                        user.picture = imagesPath + image;
                        return user.save();
                    })
                    .then(() => this.Debts.create(new DebtDto(creatorId, user._id, DebtsAccountType.SINGLE_USER, countryCode)));
            });
    }

    async deleteSingleDebt(debt: DebtInterface, userId: Id): Promise<void> {
        const virtualUserId = debt.users.find(user => user['_id'].toString() != userId);

        return debt
            .remove()
            .then(() => this.usersService.deleteUser(virtualUserId));
    }

    async acceptUserDeletedStatus(userId: Id, debtsId: Id): Promise<DebtInterface> {
        return this.Debts
            .findOne({
                _id: debtsId,
                type: DebtsAccountType.SINGLE_USER,
                status: DebtsStatus.USER_DELETED,
                statusAcceptor: userId
            })
            .populate({
                path: 'moneyOperations',
                select: 'status'
            })
            .then((debt: DebtInterface) => {
                if(!debt) {
                    throw new HttpWithRequestException('Debt is not found', HttpStatus.BAD_REQUEST);
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
            });
    };

    async connectUserToSingleDebt(userId: Id, connectUserId: Id, debtsId: Id): Promise<DebtInterface> {
        return this.Debts
            .find({users: {$all: [userId, connectUserId]}})
            .lean()
            .then((debts: DebtInterface[]) => {
                if(debts && debts['length'] > 0) {
                    throw new HttpWithRequestException('You already have Debt with this user', HttpStatus.BAD_REQUEST);
                }

                return this.Debts
                    .findOne({_id: debtsId, type: DebtsAccountType.SINGLE_USER, users: {$in: [userId]}});
            })
            .then((debt: DebtInterface) => {
                if(!debt) {
                    throw new HttpWithRequestException('Debt is not found', HttpStatus.BAD_REQUEST);
                }

                if(debt.status === DebtsStatus.CONNECT_USER) {
                    throw new HttpWithRequestException('Some user is already waiting for connection to this Debt', HttpStatus.BAD_REQUEST);
                }

                if(debt.status === DebtsStatus.USER_DELETED) {
                    throw new HttpWithRequestException('You can\'t connect user to this Debt until you resolve user deletion', HttpStatus.BAD_REQUEST);
                }

                debt.status = DebtsStatus.CONNECT_USER;
                debt.statusAcceptor = connectUserId;

                return debt.save();
            });
    };

    async acceptUserConnectionToSingleDebt(userId: Id, debtsId: Id): Promise<void> {
        return this.Debts
            .findOne({
                _id: debtsId,
                type: DebtsAccountType.SINGLE_USER,
                status: DebtsStatus.CONNECT_USER,
                statusAcceptor: userId
            })
            .populate('users', 'virtual')
            .then((debt: DebtInterface) => {
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
                        this.Operation.findById(operation)
                            .then((op: OperationInterface) => {
                                if(op.moneyReceiver === virtualUserId) {
                                    op.moneyReceiver = userId;
                                }

                                return op.save();
                            })
                    );
                });

                promises.push(
                    this.usersService.deleteUser(virtualUserId)
                );

                promises.push(
                    this.Debts.findByIdAndUpdate(debtsId, {
                        $pull: {users: virtualUserId}
                    })
                );

                return debt.save().then(() => Promise.all(promises));
            })
            .then(() => {});
    };

    async declineUserConnectionToSingleDebt(userId: Id, debtsId: Id): Promise<void> {
        return this.Debts
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
                {status: DebtsStatus.UNCHANGED, statusAcceptor: null})
            .then((debt: DebtInterface) => {
                if(!debt) {
                    throw new HttpWithRequestException('Debt is not found', HttpStatus.BAD_REQUEST);
                }
            });
    }
}
