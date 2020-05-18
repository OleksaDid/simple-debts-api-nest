import { ExtractJwt, Strategy } from 'passport-jwt';
import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {DateHelper} from '../../../common/classes/date-helper';
import {SendUserDto} from '../../users/models/user.dto';
import {ConfigService} from '../../config/services/config.service';
import {EnvField} from '../../config/models/env-field.enum';
import {JwtPayload} from '../models/jwt-payload';
import {AuthStrategy} from '../strategies-list.enum';
import {InjectModel} from 'nestjs-typegoose';
import {ModelType} from 'typegoose';
import {User} from '../../users/models/user';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AuthStrategy.JWT_STRATEGY) {

    constructor(
        @InjectModel(User) private readonly User: ModelType<User>,
        private readonly _config: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: _config.get(EnvField.JWT_SECRET),
            ignoreExpiration: true
        });
    }

    async validate(jwt_payload: JwtPayload): Promise<SendUserDto> {

      if(jwt_payload.exp < DateHelper.getNowDateInSeconds()) {
          throw new HttpException('Access Token Expired', HttpStatus.UNAUTHORIZED);
      }

      const user = await this.User.findById(jwt_payload.id).exec();

      if (!user || user.accessTokenId.toString() !== jwt_payload.jwtid.toString()) {
        throw new HttpException('Invalid Token', HttpStatus.BAD_REQUEST);
      }

      return new SendUserDto(user._id, user.name, user.picture);
    }
}
