import {SendUserDto} from "../../users/models/user.dto";

export interface AuthUser {
    user: SendUserDto;
    token: string;
    refreshToken: string;
}

export class AuthUser implements AuthUser {
    user: SendUserDto;
    token: string;
    refreshToken: string;

    constructor(user: SendUserDto, token: string, refreshToken: string) {
        this.user = user;
        this.token = token;
        this.refreshToken = refreshToken;
    }
}