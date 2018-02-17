import * as passport from 'passport';
import * as passportJWT from 'passport-jwt';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {Component, HttpStatus, Inject} from '@nestjs/common';
import {UsersProvider} from "../../users/users.providers";
import {UserInterface} from "../../users/models/user.interface";
import {Model} from "mongoose";
import {HttpWithRequestException} from "../../../services/error-handler/http-with-request.exception";
import {AuthStrategy} from "./strategies-list.enum";
import {JwtPayloadInterface} from '../models/jwt-payload';
import {DateHelper} from '../../../common/classes/date-helper';
import {SendUserDto} from '../../users/models/user.dto';


@Component()
export class JwtStrategy extends passportJWT.Strategy {
    constructor(
        @Inject(UsersProvider.UsersModelToken) private readonly User: Model<UserInterface>
    ) {
        super(
            {
                jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: process.env.JWT_SECRET,
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