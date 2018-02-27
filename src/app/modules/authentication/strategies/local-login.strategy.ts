import * as passport from 'passport';
import * as LocalStrategy from 'passport-local';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {Component, HttpStatus, Inject} from '@nestjs/common';
import {UserInterface} from "../../users/models/user.interface";
import {Model} from "mongoose";
import {AuthenticationService} from "../services/authentication/authentication.service";
import {HttpWithRequestException} from "../../../services/error-handler/http-with-request.exception";
import {AuthStrategy} from "../strategies-list.enum";
import {UsersProvider} from '../../users/users-providers.enum';


@Component()
export class LocalLoginStrategy extends LocalStrategy {
    constructor(
        private readonly authService: AuthenticationService,
        @Inject(UsersProvider.UsersModelToken) private readonly User: Model<UserInterface>
    ) {
        super(
            {
                usernameField : 'email',
                passwordField : 'password',
                passReqToCallback : true // allows us to pass back the entire request to the callback
            },
            async (req, email, password, done) => await this.verify(req, email, password, done)
        );
        passport.use(AuthStrategy.LOCAL_LOGIN_STRATEGY, this);
    }

    public async verify(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        return this.User
            .findOne({ 'email' :  email })
            .then((user: UserInterface) => {

                // if no user is found, return the message
                if (!user) {
                    throw new HttpWithRequestException('No user is found', HttpStatus.BAD_REQUEST, req);
                }

                // if the user is found but the password is wrong
                if (!user.validPassword(password)) {
                    throw new HttpWithRequestException('Wrong password', HttpStatus.BAD_REQUEST, req);
                }

                // all is well, return successful user
                return this.authService.updateTokensAndReturnUser(user, done);
            })
            .catch(err => done(err));

    }
}