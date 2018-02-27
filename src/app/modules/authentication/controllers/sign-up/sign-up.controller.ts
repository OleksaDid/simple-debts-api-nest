import {Body, Controller, Post} from '@nestjs/common';
import {AuthUser} from '../../models/auth-user';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {LocalAuthentication} from '../../models/local-authentication';

@ApiUseTags('sign_up')
@Controller('sign_up')
export class SignUpController {


    constructor(
    ) {}


    
    
    @ApiResponse({
        status: 201,
        description: 'You are successfully signed up',
        type: AuthUser
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Post('local')
    localSignUp(
        @Body() credentials: LocalAuthentication,
        @ReqUser() user: AuthUser
    ): AuthUser {
        return user;
    };
}
