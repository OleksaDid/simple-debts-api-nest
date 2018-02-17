import {IsNotEmpty, IsString, Length} from 'class-validator';
import {ApiModelProperty} from '@nestjs/swagger';

export class UserNameDto {

    @ApiModelProperty({
        description: 'username',
        type: 'string',
        required: true
    })
    @IsNotEmpty()
    @IsString()
    @Length(1, 25)
    name: string;
}
