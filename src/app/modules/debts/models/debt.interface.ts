import { Document } from 'mongoose';
import { OperationInterface } from '../../operations/operation.interface';
import {Id} from "../../../common/types/types";
import {DebtsAccountType} from './debts-account-type.enum';
import {DebtsStatus} from './debts-status.enum';


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