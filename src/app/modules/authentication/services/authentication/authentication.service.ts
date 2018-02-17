import {Component, Inject} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { UserInterface } from '../../../users/models/user.interface';
import { SendUserDto } from '../../../users/models/user.dto';
import {UsersProvider} from "../../../users/users.providers";
import {Model} from "mongoose";
import {AccessJwtPayload, RefreshJwtPayload} from "../../models/jwt-payload";
import {AuthUser} from "../../models/auth-user";



@Component()
export class AuthenticationService {


    constructor(
        @Inject(UsersProvider.UsersModelToken) private readonly User: Model<UserInterface>
    ) {}



    async updateTokensAndReturnUser(user: UserInterface, done): Promise<AuthUser> {
        const payload = new AccessJwtPayload(user._id);
        const refreshPayload = new RefreshJwtPayload(user._id);

        const token = jwt.sign(Object.assign({}, payload), process.env.JWT_SECRET);
        const refreshToken = jwt.sign(Object.assign({}, refreshPayload), process.env.REFRESH_JWT_SECRET);

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
