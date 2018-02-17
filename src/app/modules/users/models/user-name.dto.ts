import {IsNotEmpty, IsString, Length} from 'class-validator';

export class UserNameDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 25)
    name: string;
}
