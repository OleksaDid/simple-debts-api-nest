import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {DebtInterface} from '../../models/debt.interface';
import {DebtsStatus} from '../../models/debts-status.enum';
import {DebtsAccountType} from '../../models/debts-account-type.enum';
import {Id} from '../../../../common/types/types';
import {OperationInterface} from '../../../operations/models/operation.interface';
import {OperationStatus} from '../../../operations/models/operation-status.enum';
import {DebtDto} from '../../models/debt.dto';
import {UserInterface} from '../../../users/models/user.interface';
import {validate} from 'class-validator';
import {CreateVirtualUserDto} from '../../../users/models/user.dto';
import {UsersService} from '../../../users/services/users/users.service';
import {Model} from 'mongoose';
import {UserCollectionRef} from '../../../users/models/user-collection-ref';
import {DebtsCollectionRef} from '../../models/debts-collection-ref';
import {OperationsCollectionRef} from '../../../operations/models/operation-collection-ref';

@Injectable()
export class DebtsSingleService {
    constructor(
        @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>,
        @InjectModel(DebtsCollectionRef) private readonly Debts: Model<DebtInterface>,
        @InjectModel(OperationsCollectionRef) private readonly Operation: Model<OperationInterface>,
        private readonly usersService: UsersService
    ) {}



    async createSingleDebt(creatorId: Id, userName: string, countryCode: string, imagesPath: string): Promise<DebtInterface> {
        const virtUser = new CreateVirtualUserDto(userName);

        const errors = await validate(virtUser);

        if(errors) {
            throw new HttpException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
        }

        const debts = await this.Debts
            .find({'users': {'$all': [creatorId]}, 'type': DebtsAccountType.SINGLE_USER})
            .populate({ path: 'users', select: 'name virtual'});

        if(
            debts &&
            debts.length > 0 &&
            debts.some(debt => !!debt.users.find(user => user['name'] === userName && user['virtual']))
        ) {
            throw new HttpException('You already have virtual user with such name', HttpStatus.BAD_REQUEST);
        }

        const user = await this.User.create(virtUser);
        const userPicture = await new this.User().generateIdenticon(user.id);

        user.picture = imagesPath + userPicture;
        await user.save();

        return this.Debts.create(new DebtDto(creatorId, user._id, DebtsAccountType.SINGLE_USER, countryCode))
    }

    async deleteSingleDebt(debt: DebtInterface, userId: Id): Promise<void> {
        const virtualUserId = debt.users.find(user => user['_id'].toString() != userId);

        await debt.remove();

        await this.usersService.deleteUser(virtualUserId);
    }

    async acceptUserDeletedStatus(userId: Id, debtsId: Id): Promise<DebtInterface> {
        const debt = await this.Debts
            .findOne({
                _id: debtsId,
                type: DebtsAccountType.SINGLE_USER,
                status: DebtsStatus.USER_DELETED,
                statusAcceptor: userId
            })
            .populate({
                path: 'moneyOperations',
                select: 'status'
            });

        if(!debt) {
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

    async connectUserToSingleDebt(userId: Id, connectUserId: Id, debtsId: Id): Promise<DebtInterface> {
        const debtsWithConnectingUser = await this.Debts
            .find({users: {$all: [userId, connectUserId]}})
            .lean();

        if(debtsWithConnectingUser && debtsWithConnectingUser['length'] > 0) {
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
        debt.statusAcceptor = connectUserId;

        return debt.save();
    };

    async acceptUserConnectionToSingleDebt(userId: Id, debtsId: Id): Promise<void> {
        const debt = await this.Debts
            .findOne({
                _id: debtsId,
                type: DebtsAccountType.SINGLE_USER,
                status: DebtsStatus.CONNECT_USER,
                statusAcceptor: userId
            })
            .populate('users', 'virtual');

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
