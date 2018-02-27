import * as passport from 'passport';
import * as LocalStrategy from 'passport-local';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {Component, HttpStatus, Inject} from '@nestjs/common';
import {UserInterface} from "../../users/models/user.interface";
import {Model} from "mongoose";
import {AuthenticationService} from "../services/authentication/authentication.service";
import {HttpWithRequestException} from "../../../services/error-handler/http-with-request.exception";
import {AuthStrategy} from "../strategies-list.enum";
import {EMAIL_NAME_PATTERN, EMAIL_PATTERN, PASSWORD_LENGTH_RESTRICTIONS} from "../../../common/constants/constants";
import {ImagesHelper} from "../../../common/classes/images-helper";
import {UsersProvider} from '../../users/users-providers.enum';


@Component()
export class LocalSignUpStrategy extends LocalStrategy {
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
        passport.use(AuthStrategy.LOCAL_SIGN_UP_STRATEGY, this);
    }

    public async verify(req, email, password, done)  {
        let createdUser;

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(() => {

            this.User
                .findOne({ 'email' :  email })
                .then((user: UserInterface) => {
                    // check to see if theres already a user with that email
                    if (user) {
                        throw new HttpWithRequestException('User with this email already exists', HttpStatus.BAD_REQUEST, req);
                    }

                    if(!email.match(EMAIL_PATTERN)) {
                        throw new HttpWithRequestException('Email is wrong', HttpStatus.BAD_REQUEST, req);
                    }

                    if(
                        password.length < PASSWORD_LENGTH_RESTRICTIONS.min ||
                        password.length > PASSWORD_LENGTH_RESTRICTIONS.max
                    ) {
                        throw new HttpWithRequestException('Invalid password length', HttpStatus.BAD_REQUEST, req);
                    }

                    // if there is no user with that email
                    // create the user
                    const newUser: any  = new this.User();

                    // set the user's local credentials
                    newUser.email    = email;
                    newUser.password = newUser.generateHash(password);

                    // save the user
                    return newUser.save();
                })
                .then(() => this.User.findOne({email}))
                .then((user: UserInterface) => {
                    const newUser: any = new this.User();
                    createdUser = user;

                    return newUser.generateIdenticon(user.id);
                })
                .then(image => {
                    createdUser.picture = ImagesHelper.getImagesPath(req) + image;
                    createdUser.name = email.match(EMAIL_NAME_PATTERN)[0];

                    return createdUser.save();
                })
                .then(() => this.authService.updateTokensAndReturnUser(createdUser, done))
                .catch(err => done(err));

        });
    }
}