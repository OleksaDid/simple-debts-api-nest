import {IsNotEmpty, IsString, Length} from 'class-validator';
import {ApiModelProperty} from '@nestjs/swagger';

export class UserNameDto {

    @ApiModelProperty({
        description: 'username',
        type: 'string',
        required: true
    })
    @Length(1, 25)
    @IsString()
    @IsNotEmpty()
    name: string;
}
