import {OperationsCollectionRef} from "../../operations/operations.providers";
import {Schema, SchemaType} from "mongoose";
import {UserCollectionRef} from "../../users/users.providers";
import {DebtsAccountType} from './debts-account-type.enum';
import {DebtsStatus} from './debts-status.enum';


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




export const DebtSchema = new Schema({
    users: [{ type: Schema.Types.ObjectId, ref: UserCollectionRef }],

    type: Schema.Types[DebtsTypeSchemaType],

    countryCode: String,

    status: Schema.Types[DebtsStatusCodeSchemaType],
    statusAcceptor: { type: Schema.Types.ObjectId, ref: UserCollectionRef },

    summary: Number,
    moneyReceiver: { type: Schema.Types.ObjectId, ref: UserCollectionRef },

    moneyOperations: [{ type: Schema.Types.ObjectId, ref: OperationsCollectionRef }]
}, { timestamps: true });