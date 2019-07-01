import { ExtractJwt, Strategy } from 'passport-jwt';
import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {InjectModel} from '@nestjs/mongoose';
import {UserInterface} from "../../users/models/user.interface";
import {Model} from "mongoose";
import {DateHelper} from '../../../common/classes/date-helper';
import {SendUserDto} from '../../users/models/user.dto';
import {ConfigService} from '../../config/services/config.service';
import {EnvField} from '../../config/models/env-field.enum';
import {UserCollectionRef} from '../../users/models/user-collection-ref';
import {JwtPayload} from '../models/jwt-payload';
import {AuthStrategy} from '../strategies-list.enum';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AuthStrategy.JWT_STRATEGY) {

    constructor(
        @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>,
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
          throw new HttpException('Access Token Expired', HttpStatus.BAD_REQUEST);
      }

      const user: UserInterface = await this.User.findById(jwt_payload.id).lean() as UserInterface;

      if (!user || user.accessTokenId !== jwt_payload.jwtid) {
        throw new HttpException('Invalid Token', HttpStatus.BAD_REQUEST);
      }

      return new SendUserDto(user._id, user.name, user.picture);
    }
}
