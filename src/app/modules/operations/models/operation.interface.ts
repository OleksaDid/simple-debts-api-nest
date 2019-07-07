import { Document } from 'mongoose';
import {Id} from "../../../common/types/types";
import {OperationStatus} from './operation-status.enum';


export interface OperationInterface extends Document {
    debtsId: Id;
    date: Date;
    moneyAmount: number;
    moneyReceiver: Id;
    description: string;
    status: OperationStatus;
    statusAcceptor: Id;
    cancelledBy: Id;
}
