import {ApiModelProperty} from '@nestjs/swagger';
import {IsEmail, IsNotEmpty, Length} from 'class-validator';

export class LocalAuthentication {
    @ApiModelProperty({
        description: 'user email',
        required: true,
        type: 'string'
    })
    @IsNotEmpty()
    @IsEmail()
    readonly email: string;

    @ApiModelProperty({
        description: 'user password',
        required: true,
        type: 'string'
    })
    @IsNotEmpty()
    @Length(6, 20)
    readonly password: string;
}