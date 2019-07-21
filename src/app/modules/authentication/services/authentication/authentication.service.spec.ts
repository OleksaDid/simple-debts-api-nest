import {Test} from '@nestjs/testing';
import {PassportModule} from '@nestjs/passport';
import {AuthenticationService} from './authentication.service';
import {forwardRef} from '@nestjs/common';
import {UsersModule} from '../../../users/users.module';
import {AuthStrategy} from '../../strategies-list.enum';
import {ConfigModule} from '../../../config/config.module';
import {LocalSignUpStrategy} from '../../strategies/local-sign-up.strategy';
import {LocalLoginStrategy} from '../../strategies/local-login.strategy';
import {FacebookLoginStrategy} from '../../strategies/facebook-login.strategy';
import {JwtStrategy} from '../../strategies/jwt.strategy';
import {RefreshTokenStrategy} from '../../strategies/refresh-token.strategy';
import {LoginController} from '../../controllers/login/login.controller';
import {SignUpController} from '../../controllers/sign-up/sign-up.controller';

describe('AuthenticationService', () => {
  let authService: AuthenticationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        forwardRef(() => UsersModule),
        PassportModule.register({ defaultStrategy: AuthStrategy.JWT_STRATEGY, session: false }),
        ConfigModule
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
      ]
    })
    .compile();

    authService = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should exist', () => {
    expect(authService).toBeTruthy();
  });
});
