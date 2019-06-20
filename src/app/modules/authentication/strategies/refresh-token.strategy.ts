import * as passport from 'passport';
import * as passportJWT from 'passport-jwt';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {UserInterface} from '../../users/models/user.interface';
import {Model} from 'mongoose';
import {HttpWithRequestException} from '../../../services/error-handler/http-with-request.exception';
import {AuthStrategy} from '../strategies-list.enum';
import {JwtPayloadInterface} from '../models/jwt-payload';
import {DateHelper} from '../../../common/classes/date-helper';
import {AuthenticationService} from '../services/authentication/authentication.service';
import {UserCollectionRef} from '../../users/models/user-collection-ref';
import {ConfigService} from '../../config/services/config.service';
import {EnvField} from '../../config/models/env-field.enum';


@Injectable()
export class RefreshTokenStrategy extends passportJWT.Strategy {
    constructor(
        private readonly authService: AuthenticationService,
        private readonly _config: ConfigService,
        @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>
    ) {
        super(
            {
                jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: _config.get(EnvField.REFRESH_JWT_SECRET),
                ignoreExpiration: true
            },
            async (jwt_payload: JwtPayloadInterface, done) => await this.verify(jwt_payload, done)
        );
        passport.use(AuthStrategy.REFRESH_TOKEN_STRATEGY, this);
    }

    public async verify(jwt_payload: JwtPayloadInterface, done) {

        if(jwt_payload.exp < DateHelper.getNowDateInSeconds()) {
            return done(new HttpWithRequestException('Refresh Token Expired', HttpStatus.BAD_REQUEST));
        }

        this.User
            .findById(jwt_payload.id)
            .lean()
            .then((user: UserInterface) => {
                if (!user || user.refreshTokenId !== jwt_payload.jwtid) {
                    throw new HttpWithRequestException('Invalid Token', HttpStatus.BAD_REQUEST);
                }

                return this.authService.updateTokensAndReturnUser(user, done);
            })
            .catch(err => done(err));
    }
}
