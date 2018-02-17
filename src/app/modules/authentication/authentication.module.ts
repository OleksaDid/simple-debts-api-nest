import {forwardRef, Module, NestModule, RequestMethod} from '@nestjs/common';
import {AuthenticationService} from './services/authentication/authentication.service';
import {LoginController} from './controllers/login/login.controller';
import {SignUpController} from './controllers/sign-up/sign-up.controller';
import {UsersModule} from "../users/users.module";
import {MiddlewaresConsumer} from "@nestjs/common/interfaces/middlewares";
import {AuthStrategy} from "./strategies/strategies-list.enum";
import {LocalSignUpStrategy} from './strategies/local-sign-up.strategy';
import {LocalLoginStrategy} from './strategies/local-login.strategy';
import {FacebookLoginStrategy} from './strategies/facebook-login.strategy';
import {JwtStrategy} from './strategies/jwt.strategy';
import {RefreshTokenStrategy} from './strategies/refresh-token.strategy';
import {AuthMiddleware} from './middlewares/auth-middleware/auth.middleware';

@Module({
  modules: [forwardRef(() => UsersModule)],
  components: [
    AuthenticationService,
    LocalSignUpStrategy,
    LocalLoginStrategy,
    FacebookLoginStrategy,
    JwtStrategy,
    RefreshTokenStrategy
  ],
  controllers: [
    LoginController,
    SignUpController
  ],
  exports: [
    JwtStrategy
  ]
})
export class AuthenticationModule implements NestModule {
    public configure(consumer: MiddlewaresConsumer) {
        consumer
            .apply(AuthMiddleware)
            .with(AuthStrategy.JWT_STRATEGY)
            .forRoutes({ path: '/login/status', method: RequestMethod.GET });

        consumer
            .apply(AuthMiddleware)
            .with(AuthStrategy.LOCAL_LOGIN_STRATEGY)
            .forRoutes({ path: '/login/local', method: RequestMethod.POST });

        consumer
            .apply(AuthMiddleware)
            .with(AuthStrategy.FACEBOOK_LOGIN_STRATEGY)
            .forRoutes({ path: '/login/facebook', method: RequestMethod.GET });

        consumer
            .apply(AuthMiddleware)
            .with(AuthStrategy.REFRESH_TOKEN_STRATEGY)
            .forRoutes({ path: '/login/refresh_token', method: RequestMethod.GET });



        consumer
            .apply(AuthMiddleware)
            .with(AuthStrategy.LOCAL_SIGN_UP_STRATEGY)
            .forRoutes({ path: '/sign_up/local', method: RequestMethod.POST });
    }
}
