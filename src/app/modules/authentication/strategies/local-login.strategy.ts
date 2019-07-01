import * as LocalStrategy from 'passport-local';
import {PassportStrategy} from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {UserInterface} from "../../users/models/user.interface";
import {Model} from "mongoose";
import {AuthenticationService} from "../services/authentication/authentication.service";
import {AuthStrategy} from "../strategies-list.enum";
import {UserCollectionRef} from '../../users/models/user-collection-ref';
import {AuthUser} from '../models/auth-user';


@Injectable()
export class LocalLoginStrategy extends PassportStrategy(LocalStrategy, AuthStrategy.LOCAL_LOGIN_STRATEGY) {

  constructor(
    private readonly authService: AuthenticationService,
    @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>
  ) {
    super({
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    });
  }

  async validate(req, email, password): Promise<AuthUser> { // callback with email and password from our form

    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    const user = await this.User.findOne({ 'email' :  email });


    // if no user is found, return the message
    if (!user) {
      throw new HttpException('No user is found', HttpStatus.BAD_REQUEST);
    }

    // if the user is found but the password is wrong
    if (!user.validPassword(password)) {
      throw new HttpException('Wrong password', HttpStatus.BAD_REQUEST);
    }

    // all is well, return successful user
    return this.authService.updateTokensAndReturnUser(user);

  }
}
