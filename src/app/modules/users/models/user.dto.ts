import {IsMongoId, IsNotEmpty, IsOptional, IsString, IsUrl, Length} from 'class-validator';
import {ApiModelProperty} from '@nestjs/swagger';

export class SendUserDto {
    @ApiModelProperty({
        description: 'user\'s db id',
        type: 'string',
    })
    @IsMongoId()
    id: string;

    @ApiModelProperty({
        description: 'username',
        type: 'string'
    })
    @IsString()
    name: string;

    @ApiModelProperty({
        description: 'url to user\'s avatar',
        type: 'string'
    })
    @IsUrl({ require_tld: false})
    picture: string;

    constructor(id: string, name: string, picture: string) {
        this.id = id;
        this.name = name;
        this.picture = picture;
    }
}

export class UpdateUserDataDto {

    @ApiModelProperty({
        description: 'username',
        type: 'string',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 25)
    name: string;


    @ApiModelProperty({
        description: 'url to user\'s avatar',
        type: 'string',
        required: false
    })
    @IsOptional()
    @IsUrl({ require_tld: false})
    picture?: string;

    constructor(name: string, picture?: string) {
        this.name = name;

        if(picture) {
            this.picture = picture;
        }
    }
}

export class CreateVirtualUserDto {
    name: string;
    virtual: boolean;

    constructor(name: string) {
        this.name = name;
        this.virtual = true;
    }
}

export class CloneRealUserToVirtualDto {
    name: string;
    picture: string;
    virtual = true;

    constructor(name: string, picture: string) {
        this.name = name + ' BOT';
        this.picture = picture;
    }
}