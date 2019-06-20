import {forwardRef, Module, NestModule, RequestMethod, MiddlewareConsumer} from '@nestjs/common';
import {AuthenticationService} from './services/authentication/authentication.service';
import {LoginController} from './controllers/login/login.controller';
import {SignUpController} from './controllers/sign-up/sign-up.controller';
import {UsersModule} from "../users/users.module";
import {AuthStrategy} from "./strategies-list.enum";
import {LocalSignUpStrategy} from './strategies/local-sign-up.strategy';
import {LocalLoginStrategy} from './strategies/local-login.strategy';
import {FacebookLoginStrategy} from './strategies/facebook-login.strategy';
import {JwtStrategy} from './strategies/jwt.strategy';
import {RefreshTokenStrategy} from './strategies/refresh-token.strategy';
import {authMiddlewareFactory} from './middlewares/auth-middleware/auth.middleware';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [
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
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(authMiddlewareFactory(AuthStrategy.JWT_STRATEGY))
            .forRoutes({ path: '/login/status', method: RequestMethod.GET });

        consumer
            .apply(authMiddlewareFactory(AuthStrategy.LOCAL_LOGIN_STRATEGY))
            .forRoutes({ path: '/login/local', method: RequestMethod.POST });

        consumer
            .apply(authMiddlewareFactory(AuthStrategy.FACEBOOK_LOGIN_STRATEGY))
            .forRoutes({ path: '/login/facebook', method: RequestMethod.GET });

        consumer
            .apply(authMiddlewareFactory(AuthStrategy.REFRESH_TOKEN_STRATEGY))
            .forRoutes({ path: '/login/refresh_token', method: RequestMethod.GET });

        consumer
            .apply(authMiddlewareFactory(AuthStrategy.LOCAL_SIGN_UP_STRATEGY))
            .forRoutes({ path: '/sign_up/local', method: RequestMethod.POST });
    }
}
