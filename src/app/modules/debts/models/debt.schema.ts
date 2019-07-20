import {Schema} from 'mongoose';
import {DebtsAccountType} from './debts-account-type.enum';
import {DebtsStatus} from './debts-status.enum';
import {UserCollectionRef} from '../../users/models/user-collection-ref';
import {OperationsCollectionRef} from '../../operations/models/operation-collection-ref';
import {OperationStatus} from '../../operations/models/operation-status.enum';
import {OperationInterface} from '../../operations/models/operation.interface';

const DebtSchema = new Schema({
    users: [{ type: Schema.Types.ObjectId, ref: UserCollectionRef}],

    type: {
        type: String,
        enum: [
            DebtsAccountType.SINGLE_USER,
            DebtsAccountType.MULTIPLE_USERS
        ]
    },

    currency: {
        type: String,
        minlength: 3,
        maxlength: 3
    },

    status: {
        type: String,
        enum: [
            DebtsStatus.UNCHANGED,
            DebtsStatus.CREATION_AWAITING,
            DebtsStatus.CHANGE_AWAITING,
            DebtsStatus.USER_DELETED,
            DebtsStatus.CONNECT_USER
        ]
    },
    statusAcceptor: { type: Schema.Types.ObjectId, ref: UserCollectionRef},

    summary: Number,
    moneyReceiver: { type: Schema.Types.ObjectId, ref: UserCollectionRef},

    moneyOperations: [{ type: Schema.Types.ObjectId, ref: OperationsCollectionRef }]
}, { timestamps: true });


DebtSchema.methods.calculateSummary = async function() {
    if(this.moneyOperations.length > 0) {
        const operations = await this.model(OperationsCollectionRef).find({
            '_id': {$in: this.moneyOperations},
            'status': OperationStatus.UNCHANGED
        });

        const user1Summary = getUserOperationsSummary(operations, this.users[0]);
        const user2Summary = getUserOperationsSummary(operations, this.users[1]);

        this.summary = Math.abs(user1Summary - user2Summary);

        if(this.summary === 0) {
            this.moneyReceiver = null;
        } else {
            this.moneyReceiver = user1Summary > user2Summary ? this.users[0] : this.users[1];
        }
    } else {
        this.summary = 0;
        this.moneyReceiver = null;
    }

    return this.save();

    function getUserOperationsSummary(allOperations: OperationInterface[], userId: string): number {
        return allOperations
          .filter(operation => operation.moneyReceiver.toString() === userId.toString())
          .reduce((summary, operation) => summary += operation.moneyAmount, 0);
    }
};

export {DebtSchema};
