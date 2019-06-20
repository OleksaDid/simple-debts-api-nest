import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {AuthUser} from '../../models/auth-user';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {LocalAuthentication} from '../../models/local-authentication';
import {AuthStrategy} from '../../strategies-list.enum';

@ApiUseTags('sign_up')
@Controller('sign_up')
export class SignUpController {

    
    
    @ApiResponse({
        status: 201,
        description: 'You are successfully signed up',
        type: AuthUser
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @UseGuards(AuthGuard(AuthStrategy.LOCAL_SIGN_UP_STRATEGY))
    @Post('local')
    localSignUp(
        @Body() credentials: LocalAuthentication,
        @ReqUser() user: AuthUser
    ): AuthUser {
        return user;
    };
}
