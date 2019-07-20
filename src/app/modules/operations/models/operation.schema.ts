import {Schema} from "mongoose";
import {OperationStatus} from './operation-status.enum';
import {DebtsCollectionRef} from '../../debts/models/debts-collection-ref';
import {UserCollectionRef} from '../../users/models/user-collection-ref';


export const OperationsSchema = new Schema({
    debtsId: { type: Schema.Types.ObjectId, ref: DebtsCollectionRef},
    date: { type: Date, default: Date.now },
    moneyAmount: Number,
    moneyReceiver: { type: Schema.Types.ObjectId, ref: UserCollectionRef},
    description: String,
    status: {
        type: String,
        enum: [
            OperationStatus.CREATION_AWAITING,
            OperationStatus.UNCHANGED,
            OperationStatus.CANCELLED
        ]
    },
    statusAcceptor: { type: Schema.Types.ObjectId, ref: UserCollectionRef},
    cancelledBy: { type: Schema.Types.ObjectId, ref: UserCollectionRef},
});
