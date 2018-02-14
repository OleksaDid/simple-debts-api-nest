import { Document } from 'mongoose';
import { OperationInterface } from '../operations/operation.interface';
import {Id} from "../../common/types/types";

export enum DebtsStatus {
    CREATION_AWAITING = 'CREATION_AWAITING',
    UNCHANGED = 'UNCHANGED',
    CHANGE_AWAITING = 'CHANGE_AWAITING',
    USER_DELETED = 'USER_DELETED',
    CONNECT_USER = 'CONNECT_USER'
}

export enum DebtsAccountType {
    SINGLE_USER = 'SINGLE_USER',
    MULTIPLE_USERS = 'MULTIPLE_USERS'
}

export interface DebtInterface extends Document {
    users: Id[];
    type: DebtsAccountType;
    countryCode: string;
    status: DebtsStatus;
    statusAcceptor: Id;
    summary: number;
    moneyReceiver: Id;
    moneyOperations: OperationInterface[];
}