import {DebtsCollectionRef} from "../debts/debts.providers";
import {Schema, SchemaType} from "mongoose";
import {UserCollectionRef} from "../users/users.providers";
import {OperationStatus} from './operation-status.enum';


const OperationStatusCodeSchemaType = 'StatusCodeOperations';
function StatusCodeOperations(key, options) {
    SchemaType.call(this, key, options, OperationStatusCodeSchemaType);
}
StatusCodeOperations.prototype = Object.create(SchemaType.prototype);

StatusCodeOperations.prototype.cast = val => {
    const valuesArray = [
        OperationStatus.CREATION_AWAITING,
        OperationStatus.UNCHANGED
    ];
    if(valuesArray.indexOf(val) === -1) {
        throw new Error('Debt type: \"' + val + '\" is not valid');
    }

    return val;
};

Schema.Types[OperationStatusCodeSchemaType] = StatusCodeOperations;



export const OperationsSchema = new Schema({
    debtsId: { type: Schema.Types.ObjectId, ref: DebtsCollectionRef },
    date: { type: Date, default: Date.now },
    moneyAmount: Number,
    moneyReceiver: { type: Schema.Types.ObjectId, ref: UserCollectionRef },
    description: String,
    status: Schema.Types[OperationStatusCodeSchemaType],
    statusAcceptor: { type: Schema.Types.ObjectId, ref: UserCollectionRef }
});