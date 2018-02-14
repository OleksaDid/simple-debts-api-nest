import { Connection } from 'mongoose';
import {DatabaseProvider} from "../database/database.providers";
import {DebtSchema} from "./debt.schema";

export enum DebtsProvider {
    DebtsModelToken = 'DebtsModelToken'
}

export const DebtsCollectionRef = 'Debts';

export const debtsProviders = [
    {
        provide: DebtsProvider.DebtsModelToken,
        useFactory: (connection: Connection) => connection.model(DebtsCollectionRef, DebtSchema),
        inject: [DatabaseProvider.DbConnectionToken],
    },
];