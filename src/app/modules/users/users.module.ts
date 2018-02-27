import {forwardRef, Module, NestModule, RequestMethod} from '@nestjs/common';
import {usersProviders} from "./users.providers";
import {DatabaseModule} from "../database/database.module";
import {UsersService} from './services/users/users.service';
import {UsersController} from './controllers/users/users.controller';
import {MiddlewaresConsumer} from '@nestjs/common/interfaces/middlewares';
import {AuthenticationModule} from '../authentication/authentication.module';
import {UploadImageMiddleware} from '../../middlewares/upload-image/upload-image.middleware';
import {DebtsModule} from '../debts/debts.module';
import {AuthMiddleware} from '../authentication/middlewares/auth-middleware/auth.middleware';
import {AuthStrategy} from '../authentication/strategies-list.enum';

@Module({
    modules: [
        DatabaseModule,
        forwardRef(() => AuthenticationModule),
        forwardRef(() => DebtsModule)
    ],
    controllers: [
        UsersController
    ],
    components: [
        ...usersProviders,
        UsersService
    ],
    exports: [
        ...usersProviders,
        UsersService
    ]
})
export class UsersModule implements NestModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer
            .apply(AuthMiddleware)
            .with(AuthStrategy.LOCAL_LOGIN_STRATEGY)
            .forRoutes({ path: '/users', method: RequestMethod.ALL });

        consumer
            .apply(UploadImageMiddleware)
            .forRoutes({ path: '/users', method: RequestMethod.POST });
    }
}
