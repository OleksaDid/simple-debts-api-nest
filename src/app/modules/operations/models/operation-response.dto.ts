import {Id} from '../../../common/types/types';
import {OperationStatus} from './operation-status.enum';
import {ApiModelProperty} from '@nestjs/swagger';
import {IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {OperationBody} from './operation-body.class';

export class OperationResponseDto extends OperationBody {
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

    @ApiModelProperty({
        description: 'id of user who has cancelled the operation',
        type: 'string'
    })
    @IsOptional()
    @IsMongoId()
    cancelledBy?: Id;

    constructor(id: Id, date: Date, moneyAmount: number, moneyReceiver: Id, description: string, status: OperationStatus, statusAcceptor: Id, cancelledBy: Id) {
        super();
        this.id = id;
        this.date = date;
        this.moneyAmount = moneyAmount;
        this.moneyReceiver = moneyReceiver;
        this.description = description;
        this.status = status;
        this.statusAcceptor = statusAcceptor;
        this.cancelledBy = cancelledBy;
    }
}
