import {IsMongoId, IsNotEmpty, IsString, Length} from 'class-validator';
import {ApiModelProperty} from '@nestjs/swagger';

export class CreateDebtDto {
    @ApiModelProperty({
        description: 'id of user you want to create debt with',
        required: true,
        type: 'string'
    })
    @IsNotEmpty()
    @IsMongoId()
    userId: string;

    @ApiModelProperty({
        description: 'ISO2 country code of currency you use',
        required: true,
        type: 'string'
    })
    @IsNotEmpty()
    @IsString()
    @Length(2, 2)
    countryCode: string;

    constructor(userId: string, countryCode: string) {
        this.userId = userId;
        this.countryCode = countryCode;
    }
}