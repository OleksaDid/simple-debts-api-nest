import { PassportStrategy } from '@nestjs/passport';
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
import {AuthStrategy} from '../strategies-list.enum';
import {AuthUser} from '../models/auth-user';


@Injectable()
export class FacebookLoginStrategy extends PassportStrategy(FacebookTokenStrategy, AuthStrategy.FACEBOOK_LOGIN_STRATEGY) {

    constructor(
        private readonly _authService: AuthenticationService,
        private readonly _config: ConfigService,
        @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>
    ) {
        super({
            clientID: _config.get(EnvField.FACEBOOK_ID),
            clientSecret: _config.get(EnvField.FACEBOOK_SECRET),
        });
    }

    async validate(accessToken: string, refreshToken: string, profile): Promise<AuthUser> {
      let user = await this.User.findOne({'facebook': profile.id}).exec();

      if(!user) {
        user = new this.User();
      }

      user.email = profile._json.email;
      user.name = `${profile.name.givenName} ${profile.name.familyName}`;
      user.picture = ImagesHelper.generateFbImagePath(profile.id);
      user.facebook = profile.id;

      const savedUser = await user.save();

      return this._authService.updateTokensAndReturnUser(savedUser);
    }
}
