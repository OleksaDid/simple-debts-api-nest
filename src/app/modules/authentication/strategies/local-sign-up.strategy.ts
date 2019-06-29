import * as LocalStrategy from 'passport-local';
import {PassportStrategy} from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {UserInterface} from "../../users/models/user.interface";
import {Model} from 'mongoose';
import {AuthenticationService} from "../services/authentication/authentication.service";
import {AuthStrategy} from "../strategies-list.enum";
import {EMAIL_NAME_PATTERN, EMAIL_PATTERN, PASSWORD_LENGTH_RESTRICTIONS} from "../../../common/constants/constants";
import {UserCollectionRef} from '../../users/models/user-collection-ref';
import {AuthUser} from '../models/auth-user';
import {Request} from 'express';
import {UsersService} from '../../users/services/users/users.service';


@Injectable()
export class LocalSignUpStrategy extends PassportStrategy(LocalStrategy, AuthStrategy.LOCAL_SIGN_UP_STRATEGY) {
    constructor(
        private readonly authService: AuthenticationService,
        private _userService: UsersService,
        @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>
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
      const newUser: any  = new this.User();

      // set the user's local credentials
      newUser.email    = email;
      newUser.password = newUser.generateHash(password);

      // save the user
      await newUser.save();

      createdUser = await this.User.findOne({email}).exec();

      createdUser.picture = await this._userService.generateUserIdenticon(createdUser.id, req.hostname);
      createdUser.name = email.match(EMAIL_NAME_PATTERN)[0];

      await createdUser.save();

      return this.authService.updateTokensAndReturnUser(createdUser);
    }
}
