import * as LocalStrategy from 'passport-local';
import {PassportStrategy} from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {AuthenticationService} from "../services/authentication/authentication.service";
import {AuthStrategy} from "../strategies-list.enum";
import {EMAIL_NAME_PATTERN, EMAIL_PATTERN, PASSWORD_LENGTH_RESTRICTIONS} from "../../../common/constants/constants";
import {AuthUser} from '../models/auth-user';
import {Request} from 'express';
import {UsersService} from '../../users/services/users/users.service';
import {RequestHelper} from '../../../common/classes/request-helper';
import {InjectModel} from 'nestjs-typegoose';
import {ModelType} from 'typegoose';
import {User} from '../../users/models/user';


@Injectable()
export class LocalSignUpStrategy extends PassportStrategy(LocalStrategy, AuthStrategy.LOCAL_SIGN_UP_STRATEGY) {
    constructor(
        private readonly authService: AuthenticationService,
        private _userService: UsersService,
        @InjectModel(User) private readonly User: ModelType<User>
    ) {
        super({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        });
    }

    async validate(req: Request, email, password): Promise<AuthUser>  {
      let createdUser;

      const user = await this.User.findOne({ 'email' :  email });

      // check to see if theres already a user with that email
      if (user) {
        throw new HttpException('User with this email already exists', HttpStatus.BAD_REQUEST);
      }

      if(!email.match(EMAIL_PATTERN)) {
        throw new HttpException('Email is wrong', HttpStatus.BAD_REQUEST);
      }

      if(
        password.length < PASSWORD_LENGTH_RESTRICTIONS.min ||
        password.length > PASSWORD_LENGTH_RESTRICTIONS.max
      ) {
        throw new HttpException('Invalid password length', HttpStatus.BAD_REQUEST);
      }

      // if there is no user with that email
      // create the user
      const newUser  = new this.User();

      // set the user's local credentials
      newUser.email = email;
      newUser.name = email.match(EMAIL_NAME_PATTERN)[0];
      newUser.generatePasswordHash(password);
      newUser.picture = await this._userService.generateUserIdenticon(newUser.id, RequestHelper.getFormattedHostAndProtocol(req));

      // save the user
      await newUser.save();

      return this.authService.updateTokensAndReturnUser(newUser);
    }
}
