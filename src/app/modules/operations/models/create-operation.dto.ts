import {ApiModelProperty} from '@nestjs/swagger';
import {IsMongoId, IsNotEmpty} from 'class-validator';
import {Id} from '../../../common/types/types';
import {OperationBody} from './operation-body.class';

export class CreateOperationDto extends OperationBody {
    @ApiModelProperty({
        description: 'id of debts entity',
        type: 'string'
    })
    @IsNotEmpty()
    @IsMongoId()
    debtsId: Id;
}