import { Connection } from 'mongoose';
import {DatabaseProvider} from "../database/database.providers";
import UserSchema from "./models/user.schema";
import {UsersProvider} from './users-providers.enum';

export const UserCollectionRef = 'User';

export const usersProviders = [
    {
        provide: UsersProvider.UsersModelToken,
        useFactory: (connection: Connection) => connection.model(UserCollectionRef, UserSchema),
        inject: [DatabaseProvider.DbConnectionToken],
    },
];