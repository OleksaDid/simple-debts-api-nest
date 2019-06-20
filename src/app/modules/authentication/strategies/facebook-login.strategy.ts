import * as passport from 'passport';
import * as FacebookTokenStrategy from 'passport-facebook-token';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {UserInterface} from '../../users/models/user.interface';
import {Model} from 'mongoose';
import {AuthenticationService} from '../services/authentication/authentication.service';
import {ImagesHelper} from '../../../common/classes/images-helper';
import {ConfigService} from '../../config/services/config.service';
import {EnvField} from '../../config/models/env-field.enum';
import {UserCollectionRef} from '../../users/models/user-collection-ref';


@Injectable()
export class FacebookLoginStrategy extends FacebookTokenStrategy {
    constructor(
        private readonly _authService: AuthenticationService,
        private readonly _config: ConfigService,
        @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>
    ) {
        super(
            {
                clientID: _config.get(EnvField.FACEBOOK_ID),
                clientSecret: _config.get(EnvField.FACEBOOK_SECRET),
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
            .then((user: UserInterface) => this._authService.updateTokensAndReturnUser(user, done))
            .catch(err => done(err));

    }
}
