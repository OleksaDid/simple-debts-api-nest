import { Connection } from 'mongoose';
import {DatabaseProvider} from "../database/database.providers";
import {OperationsSchema} from "./models/operation.schema";

export enum OperationsProvider {
    OperationsModelToken = 'OperationsModelToken'
}

export const OperationsCollectionRef = 'MoneyOperation';

export const operationsProviders = [
    {
        provide: OperationsProvider.OperationsModelToken,
        useFactory: (connection: Connection) => connection.model(OperationsCollectionRef, OperationsSchema),
        inject: [DatabaseProvider.DbConnectionToken],
    },
];