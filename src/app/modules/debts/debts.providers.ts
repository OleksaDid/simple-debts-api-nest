import { Connection } from 'mongoose';
import {DatabaseProvider} from "../database/database.providers";
import {DebtSchema} from "./models/debt.schema";
import {DebtsProvider} from './debts-providers.enum';


export const DebtsCollectionRef = 'Debts';

export const debtsProviders = [
    {
        provide: DebtsProvider.DebtsModelToken,
        useFactory: (connection: Connection) => connection.model(DebtsCollectionRef, DebtSchema),
        inject: [DatabaseProvider.DbConnectionToken],
    },
];