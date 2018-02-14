import * as passport from 'passport';
import * as FacebookTokenStrategy from 'passport-facebook-token';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {Component, Inject} from '@nestjs/common';
import {UsersProvider} from "../../users/users.providers";
import {UserInterface} from "../../users/user.interface";
import {Model} from "mongoose";
import {AuthenticationService} from "../services/authentication/authentication.service";
import {ImagesHelper} from '../../../common/classes/images-helper';


@Component()
export class FacebookLoginStrategy extends FacebookTokenStrategy {
    constructor(
        private readonly authService: AuthenticationService,
        @Inject(UsersProvider.UsersModelToken) private readonly User: Model<UserInterface>
    ) {
        super(
            {
                clientID: process.env.FACEBOOK_ID,
                clientSecret: process.env.FACEBOOK_SECRET
            },
            async (accessToken, refreshToken, profile, done) => await this.verify(accessToken, refreshToken, profile, done)
        );
        passport.use(this);
    }

    public async verify(accessToken, refreshToken, profile, done) {

        this.User
            .findOne({'facebook': profile.id})
            .exec()
            .then((user: any) => {

                if(!user) {
                    user = new this.User();
                }

                user.email = profile._json.email;
                user.name = `${profile.name.givenName} ${profile.name.familyName}`;
                user.picture = ImagesHelper.generateFbImagePath(profile.id);
                user.facebook = profile.id;

                return user.save();
            })
            .then((user: UserInterface) => this.authService.updateTokensAndReturnUser(user, done))
            .catch(err => done(err));

    }
}