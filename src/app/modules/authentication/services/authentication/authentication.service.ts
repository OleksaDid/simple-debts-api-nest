import {Injectable} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import {SendUserDto} from '../../../users/models/user.dto';
import {AccessJwtPayload, RefreshJwtPayload} from '../../models/jwt-payload';
import {AuthUser} from '../../models/auth-user';
import {ConfigService} from '../../../config/services/config.service';
import {EnvField} from '../../../config/models/env-field.enum';
import {InjectModel} from 'nestjs-typegoose';
import {ModelType, InstanceType} from 'typegoose';
import {User} from '../../../users/models/user';

@Injectable()
export class AuthenticationService {

  constructor(
    @InjectModel(User) private readonly User: ModelType<User>,
    private readonly _config: ConfigService
  ) {}


  async updateTokensAndReturnUser(user: InstanceType<User>): Promise<AuthUser> {
    const payload = new AccessJwtPayload(user._id);
    const refreshPayload = new RefreshJwtPayload(user._id);

    const token = jwt.sign(Object.assign({}, payload), this._config.get(EnvField.JWT_SECRET));
    const refreshToken = jwt.sign(Object.assign({}, refreshPayload), this._config.get(EnvField.REFRESH_JWT_SECRET));

    const authUser = new AuthUser(
        new SendUserDto(user._id, user.name, user.picture),
        token,
        refreshToken
    );

    await this.User
      .findByIdAndUpdate(user._id, {
          accessTokenId: payload.jwtid,
          refreshTokenId: refreshPayload.jwtid
      });

    return authUser;
  }

}
