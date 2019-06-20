import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import * as jwt from 'jsonwebtoken';
import {UserInterface} from '../../../users/models/user.interface';
import {SendUserDto} from '../../../users/models/user.dto';
import {Model} from 'mongoose';
import {AccessJwtPayload, RefreshJwtPayload} from '../../models/jwt-payload';
import {AuthUser} from '../../models/auth-user';
import {UserCollectionRef} from '../../../users/models/user-collection-ref';
import {ConfigService} from '../../../config/services/config.service';
import {EnvField} from '../../../config/models/env-field.enum';

@Injectable()
export class AuthenticationService {


    constructor(
        @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>,
        private readonly _config: ConfigService
    ) {}



    async updateTokensAndReturnUser(user: UserInterface, done): Promise<AuthUser> {
        const payload = new AccessJwtPayload(user._id);
        const refreshPayload = new RefreshJwtPayload(user._id);

        const token = jwt.sign(Object.assign({}, payload), this._config.get(EnvField.JWT_SECRET));
        const refreshToken = jwt.sign(Object.assign({}, refreshPayload), this._config.get(EnvField.REFRESH_JWT_SECRET));

        const authUser = new AuthUser(
            new SendUserDto(user._id, user.name, user.picture),
            token,
            refreshToken
        );

        return this.User
            .findByIdAndUpdate(user._id, {
                accessTokenId: payload.jwtid,
                refreshTokenId: refreshPayload.jwtid
            })
            .then(() => done(null, authUser))
            .catch(err => done(err));
    }

}
