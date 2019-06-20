import {Test} from '@nestjs/testing';
import {LoginController} from './login.controller';
import {forwardRef} from '@nestjs/common';
import {UsersModule} from '../../../users/users.module';
import {AuthenticationService} from '../../services/authentication/authentication.service';
import {LocalSignUpStrategy} from '../../strategies/local-sign-up.strategy';
import {LocalLoginStrategy} from '../../strategies/local-login.strategy';
import {FacebookLoginStrategy} from '../../strategies/facebook-login.strategy';
import {JwtStrategy} from '../../strategies/jwt.strategy';
import {RefreshTokenStrategy} from '../../strategies/refresh-token.strategy';
import {SignUpController} from '../sign-up/sign-up.controller';

describe('LoginController', () => {
  let loginController: LoginController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
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
    }).compile();

    loginController = module.get<LoginController>(LoginController);
  });

  it('should exist', () => {
    expect(loginController).toBeTruthy();
  });
});
