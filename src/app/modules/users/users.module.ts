import * as passport from 'passport';
import {forwardRef, Module, NestModule, RequestMethod} from '@nestjs/common';
import {usersProviders} from "./users.providers";
import {DatabaseModule} from "../database/database.module";
import {UsersService} from './services/users/users.service';
import {UsersController} from './controllers/users/users.controller';
import {MiddlewaresConsumer} from '@nestjs/common/interfaces/middlewares';
import {AuthenticationModule} from '../authentication/authentication.module';
import {AuthStrategy} from '../authentication/strategies/strategies-list.enum';
import {UploadImageMiddleware} from '../../middlewares/upload-image/upload-image.middleware';
import {DebtsModule} from '../debts/debts.module';

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
            .apply(passport.authenticate(AuthStrategy.JWT_STRATEGY, {session: false}))
            .forRoutes(
                    { path: '/users', method: RequestMethod.GET },
                    { path: '/users', method: RequestMethod.POST }
                );

        consumer
            .apply(UploadImageMiddleware)
            .forRoutes({ path: '/users', method: RequestMethod.POST });
    }
}
