import {Id} from '../types/types';
import {IsMongoId, IsNotEmpty} from 'class-validator';

export class IdParamDto {
    @IsNotEmpty()
    @IsMongoId()
    id: Id;
}