import {forwardRef, Module, NestModule, RequestMethod} from '@nestjs/common';
import {usersProviders} from "./users.providers";
import {DatabaseModule} from "../database/database.module";
import {UsersService} from './services/users/users.service';
import {UsersController} from './controllers/users/users.controller';
import {MiddlewaresConsumer} from '@nestjs/common/interfaces/middlewares';
import {AuthenticationModule} from '../authentication/authentication.module';
import {UploadImageMiddleware} from '../../middlewares/upload-image/upload-image.middleware';
import {DebtsModule} from '../debts/debts.module';
import checkJWTAccess from '../authentication/middlewares/check-jwt/check-jwt.middleware';

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
    exports: [...usersProviders]
})
export class UsersModule implements NestModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer
            .apply(checkJWTAccess)
            .forRoutes({ path: '/users', method: RequestMethod.ALL });

        consumer
            .apply(UploadImageMiddleware)
            .forRoutes({ path: '/users', method: RequestMethod.POST });
    }
}
