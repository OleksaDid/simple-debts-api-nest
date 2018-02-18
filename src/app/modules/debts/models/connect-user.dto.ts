import {ApiModelProperty} from '@nestjs/swagger';
import {IsMongoId, IsNotEmpty} from 'class-validator';
import {Id} from '../../../common/types/types';

export class ConnectUserDto {
    @ApiModelProperty({
        description: 'id of user you want to connect',
        required: true,
        type: 'string'
    })
    @IsNotEmpty()
    @IsMongoId()
    userId: Id;
}