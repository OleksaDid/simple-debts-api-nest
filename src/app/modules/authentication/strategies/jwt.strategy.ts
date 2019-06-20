import * as passport from 'passport';
import * as passportJWT from 'passport-jwt';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {UserInterface} from "../../users/models/user.interface";
import {Model} from "mongoose";
import {HttpWithRequestException} from "../../../services/error-handler/http-with-request.exception";
import {AuthStrategy} from "../strategies-list.enum";
import {JwtPayloadInterface} from '../models/jwt-payload';
import {DateHelper} from '../../../common/classes/date-helper';
import {SendUserDto} from '../../users/models/user.dto';
import {ConfigService} from '../../config/services/config.service';
import {EnvField} from '../../config/models/env-field.enum';
import {UserCollectionRef} from '../../users/models/user-collection-ref';


@Injectable()
export class JwtStrategy extends passportJWT.Strategy {
    constructor(
        @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>,
        private readonly _config: ConfigService
    ) {
        super(
            {
                jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: _config.get(EnvField.JWT_SECRET),
                ignoreExpiration: true
            },
            async (jwt_payload: JwtPayloadInterface, done) => await this.verify(jwt_payload, done)
        );
        passport.use(AuthStrategy.JWT_STRATEGY, this);
    }

    public async verify(jwt_payload: JwtPayloadInterface, done) {

        if(jwt_payload.exp < DateHelper.getNowDateInSeconds()) {
            return done(new HttpWithRequestException('Access Token Expired', HttpStatus.BAD_REQUEST));
        }

        this.User
            .findById(jwt_payload.id)
            .lean()
            .then((user: UserInterface) => {
                if (!user || user.accessTokenId !== jwt_payload.jwtid) {
                    throw new HttpWithRequestException('Invalid Token', HttpStatus.BAD_REQUEST);
                }

                done(null, new SendUserDto(user._id, user.name, user.picture));
            })
            .catch(err => done(err));
    }
}
