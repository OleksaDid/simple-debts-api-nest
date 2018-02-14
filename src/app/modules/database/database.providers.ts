import * as mongoose from 'mongoose';

export enum DatabaseProvider {
    DbConnectionToken = 'DbConnectionToken'
}

export const databaseProviders = [
    {
        provide: 'DbConnectionToken',
        useFactory: async () => {
            (mongoose as any).Promise = global.Promise;
            const mongoServer = process.env.ENVIRONMENT === 'LOCAL' ? process.env.MONGODB_URI : process.env.MONGOLAB_URI;

            const mongoConnection = await mongoose.connect(mongoServer, {
                useMongoClient: true,
            });

            mongoose.connection.on('error', () => {
                this.errHandler.captureError('MongoDB connection error. Please make sure MongoDB is running.');
                process.exit();
            });

            return mongoConnection;
        },
    }
];