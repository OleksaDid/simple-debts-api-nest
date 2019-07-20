import {IsNotEmpty, IsString} from 'class-validator';
import {ApiModelProperty} from '@nestjs/swagger';

export class UserTokenDto {

  @ApiModelProperty({
    description: 'device\'s token for push notifications',
    type: 'string',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
