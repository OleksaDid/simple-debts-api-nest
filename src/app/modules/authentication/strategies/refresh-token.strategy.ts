import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {UserInterface} from '../../users/models/user.interface';
import {Model} from 'mongoose';
import {AuthStrategy} from '../strategies-list.enum';
import {DateHelper} from '../../../common/classes/date-helper';
import {AuthenticationService} from '../services/authentication/authentication.service';
import {UserCollectionRef} from '../../users/models/user-collection-ref';
import {ConfigService} from '../../config/services/config.service';
import {EnvField} from '../../config/models/env-field.enum';
import {JwtPayload} from '../models/jwt-payload';
import {AuthUser} from '../models/auth-user';


@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, AuthStrategy.REFRESH_TOKEN_STRATEGY) {

    constructor(
        private readonly authService: AuthenticationService,
        private readonly _config: ConfigService,
        @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: _config.get(EnvField.REFRESH_JWT_SECRET),
            ignoreExpiration: true
        });
    }

    async validate(jwt_payload: JwtPayload): Promise<AuthUser> {

      if(jwt_payload.exp < DateHelper.getNowDateInSeconds()) {
          throw new HttpException('Refresh Token Expired', HttpStatus.BAD_REQUEST);
      }

      const user: UserInterface = await this.User.findById(jwt_payload.id).lean() as UserInterface;

      if (!user || user.refreshTokenId !== jwt_payload.jwtid) {
        throw new HttpException('Invalid Token', HttpStatus.BAD_REQUEST);
      }

      return this.authService.updateTokensAndReturnUser(user);
    }
}
