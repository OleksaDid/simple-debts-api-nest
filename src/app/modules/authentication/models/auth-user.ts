import {SendUserDto} from "../../users/models/user.dto";
import {ApiModelProperty} from '@nestjs/swagger';

export class AuthUser {
    @ApiModelProperty({
        description: 'your user data',
        type: SendUserDto
    })
    user: SendUserDto;

    @ApiModelProperty({
        description: 'access token',
        type: 'string'
    })
    token: string;

    @ApiModelProperty({
        description: 'refresh token',
        type: 'string'
    })
    refreshToken: string;

    constructor(user: SendUserDto, token: string, refreshToken: string) {
        this.user = user;
        this.token = token;
        this.refreshToken = refreshToken;
    }
}
