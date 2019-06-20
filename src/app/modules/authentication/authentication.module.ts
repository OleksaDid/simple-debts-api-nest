import {forwardRef, Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
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

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: AuthStrategy.JWT_STRATEGY, session: false }),
  ],
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
    JwtStrategy,
    PassportModule,
  ]
})
export class AuthenticationModule {}
