import { Document } from 'mongoose';
import {Id} from "../../common/types/types";

export enum OperationStatus {
    CREATION_AWAITING = 'CREATION_AWAITING',
    UNCHANGED = 'UNCHANGED'
}

export interface OperationInterface extends Document {
    debtsId: Id;
    date: Date;
    moneyAmount: number;
    moneyReceiver: Id;
    description: string;
    status: OperationStatus;
    statusAcceptor: Id;
}