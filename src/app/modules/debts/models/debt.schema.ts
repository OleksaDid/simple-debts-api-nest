import {Schema, SchemaType, Types} from 'mongoose';
import {DebtsAccountType} from './debts-account-type.enum';
import {DebtsStatus} from './debts-status.enum';
import {UserCollectionRef} from '../../users/models/user-collection-ref';
import {OperationsCollectionRef} from '../../operations/models/operation-collection-ref';
import {OperationStatus} from '../../operations/models/operation-status.enum';
import {OperationInterface} from '../../operations/models/operation.interface';


const DebtsTypeSchemaType = 'DebtsType';
function DebtsType(key, options) {
    SchemaType.call(this, key, options, DebtsTypeSchemaType);
}
DebtsType.prototype = Object.create(SchemaType.prototype);

DebtsType.prototype.cast = val => {
    const valuesArray = [
        DebtsAccountType.SINGLE_USER,
        DebtsAccountType.MULTIPLE_USERS
    ];

    if(valuesArray.indexOf(val) === -1) {
        throw new Error('Debt type: \"' + val + '\" is not valid');
    }

    return val;
};

Schema.Types[DebtsTypeSchemaType] =  DebtsType;



const DebtsStatusCodeSchemaType = 'StatusCodeDebts';
function StatusCodeDebts(key, options) {
    SchemaType.call(this, key, options, DebtsStatusCodeSchemaType);
}
StatusCodeDebts.prototype = Object.create(SchemaType.prototype);

StatusCodeDebts.prototype.cast = val => {
    const valuesArray = [
        DebtsStatus.UNCHANGED,
        DebtsStatus.CREATION_AWAITING,
        DebtsStatus.CHANGE_AWAITING,
        DebtsStatus.USER_DELETED,
        DebtsStatus.CONNECT_USER
    ];

    if(valuesArray.indexOf(val) === -1) {
        throw new Error('Debt type: \"' + val + '\" is not valid');
    }

    return val;
};

Schema.Types[DebtsStatusCodeSchemaType] = StatusCodeDebts;



const DebtSchema = new Schema({
    users: [{ type: Schema.Types.ObjectId, ref: UserCollectionRef}],

    type: Schema.Types[DebtsTypeSchemaType],

    currency: String,

    status: Schema.Types[DebtsStatusCodeSchemaType],
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

        this.moneyReceiver = user1Summary > user2Summary ? this.users[0] : this.users[1];
        this.summary = Math.abs(user1Summary - user2Summary);
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
