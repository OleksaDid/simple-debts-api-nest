import {SendUserDto} from '../../users/models/user.dto';
    import {DebtsAccountType} from './debts-account-type.enum';
import {DebtsStatus} from './debts-status.enum';
import {Id} from '../../../common/types/types';
import {OperationResponseDto} from '../../operations/operation-response.dto';
import {IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsPositive, IsString, Length} from 'class-validator';
import {ApiModelProperty} from '@nestjs/swagger';

export class DebtResponseDto {
    @ApiModelProperty({
        description: 'debts id',
        type: 'string'
    })
    @IsNotEmpty()
    @IsMongoId()
    id: Id;

    @ApiModelProperty({
        description: 'user you have debts with',
        type: SendUserDto
    })
    user: SendUserDto;

    @ApiModelProperty({
        description: 'debts account type',
        type: DebtsAccountType
    })
    @IsNotEmpty()
    @IsEnum(DebtsAccountType)
    type: DebtsAccountType;

    @ApiModelProperty({
        description: 'ISO2 country code of currency you use',
        type: 'string'
    })
    @IsNotEmpty()
    @IsString()
    @Length(2, 2)
    countryCode: string;

    @ApiModelProperty({
        description: 'debts status',
        type: DebtsStatus
    })
    @IsNotEmpty()
    @IsEnum(DebtsStatus)
    status: DebtsStatus;

    @ApiModelProperty({
        description: 'id of user who need to perform an action upon this entity',
        type: 'string'
    })
    @IsNotEmpty()
    @IsMongoId()
    statusAcceptor: Id;

    @ApiModelProperty({
        description: 'amount of debted money',
        type: 'number'
    })
    @IsNumber()
    @IsPositive()
    summary: number;

    @ApiModelProperty({
        description: 'id of user who receives summary money',
        type: 'string'
    })
    @IsNotEmpty()
    @IsMongoId()
    moneyReceiver: Id;

    @ApiModelProperty({
        description: 'list of operations collected in this debt entity',
        type: OperationResponseDto,
        isArray: true
    })
    @IsArray()
    moneyOperations: OperationResponseDto[];


    constructor(id: Id, user: SendUserDto, type: DebtsAccountType, countryCode: string, status: DebtsStatus, statusAcceptor: Id, summary: number, moneyReceiver: Id, moneyOperations: OperationResponseDto[]) {
        this.id = id;
        this.user = user;
        this.type = type;
        this.countryCode = countryCode;
        this.status = status;
        this.statusAcceptor = statusAcceptor;
        this.summary = summary;
        this.moneyReceiver = moneyReceiver;
        this.moneyOperations = moneyOperations;
    }
}
