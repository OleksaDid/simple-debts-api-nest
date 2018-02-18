import {Id} from '../../common/types/types';
import {OperationStatus} from './operation-status.enum';
import {ApiModelProperty} from '@nestjs/swagger';
import {IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsPositive, IsString, Length} from 'class-validator';

export class OperationResponseDto {
    @ApiModelProperty({
        description: 'operation id',
        type: 'string'
    })
    @IsNotEmpty()
    @IsMongoId()
    id: Id;

    @ApiModelProperty({
        description: 'creation date',
        type: 'string'
    })
    @IsString()
    @IsDateString()
    date: Date;

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

    @ApiModelProperty({
        description: 'operation status',
        type: OperationStatus
    })
    @IsNotEmpty()
    @IsEnum(OperationStatus)
    status: OperationStatus;

    @ApiModelProperty({
        description: 'id of user who need to perform an action upon this entity',
        type: 'string'
    })
    @IsNotEmpty()
    @IsMongoId()
    statusAcceptor: Id;

    constructor(id: Id, date: Date, moneyAmount: number, moneyReceiver: Id, description: string, status: OperationStatus, statusAcceptor: Id) {
        this.id = id;
        this.date = date;
        this.moneyAmount = moneyAmount;
        this.moneyReceiver = moneyReceiver;
        this.description = description;
        this.status = status;
        this.statusAcceptor = statusAcceptor;
    }
}
