import {ApiModelProperty} from '@nestjs/swagger';
import {IsMongoId, IsNotEmpty, IsNumber, IsPositive, IsString, Length} from 'class-validator';
import {Id} from '../../../common/types/types';

export class OperationBody {
    @ApiModelProperty({
        description: 'amount of money given',
        type: 'number'
    })
    @IsNumber()
    @IsPositive()
    moneyAmount: number;

    @ApiModelProperty({
        description: 'id of user who receives money',
        type: 'string'
    })
    @IsNotEmpty()
    @IsMongoId()
    moneyReceiver: Id;

    @ApiModelProperty({
        description: 'some notes about operation',
        type: 'string'
    })
    @IsNotEmpty()
    @IsString()
    @Length(0, 70)
    description: string;
}