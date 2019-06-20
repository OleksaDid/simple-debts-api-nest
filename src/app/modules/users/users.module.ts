import {forwardRef, MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {UsersService} from './services/users/users.service';
import {UsersController} from './controllers/users/users.controller';
import {AuthenticationModule} from '../authentication/authentication.module';
import {UploadImageMiddleware} from '../../middlewares/upload-image/upload-image.middleware';
import {DebtsModule} from '../debts/debts.module';
import {UserSchema} from './models/user.schema';
import {UserCollectionRef} from './models/user-collection-ref';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: UserCollectionRef, schema: UserSchema }]),
        forwardRef(() => AuthenticationModule),
        forwardRef(() => DebtsModule)
    ],
    controllers: [
        UsersController
    ],
    providers: [
        UsersService
    ],
    exports: [
        MongooseModule.forFeature([{ name: UserCollectionRef, schema: UserSchema }]),
        UsersService
    ]
})
export class UsersModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(UploadImageMiddleware)
            .forRoutes({ path: '/users', method: RequestMethod.POST });
    }
}
