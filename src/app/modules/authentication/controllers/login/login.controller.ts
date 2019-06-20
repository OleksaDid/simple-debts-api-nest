import {Controller, Get, HttpStatus, Response, Post, Body} from '@nestjs/common';
import {AuthUser} from '../../models/auth-user';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {ApiBearerAuth, ApiImplicitHeader, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {LocalAuthentication} from '../../models/local-authentication';

@ApiUseTags('login')
@Controller('login')
export class LoginController {

    @ApiImplicitHeader({
        name: 'Authorization',
        description: 'Must contain \'Bearer *FB_TOKEN*\'',
        required: true
    })
    @ApiResponse({
        status: 200,
        description: 'You are successfully logined/signed up via facebook',
        type: AuthUser
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Get('facebook')
    facebookLogin(@ReqUser() user: AuthUser): AuthUser {
        return user;
    };




    @ApiImplicitHeader({
        name: 'Authorization',
        description: 'Must contain \'Bearer *REFRESH_TOKEN*\'',
        required: true
    })
    @ApiResponse({
        status: 200,
        description: 'Your tokens are reset',
        type: AuthUser
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Get('refresh_token')
    refreshToken(@ReqUser() user: AuthUser): AuthUser {
        return user;
    };




    @ApiResponse({
        status: 201,
        description: 'You are logged in',
        type: AuthUser
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Post('local')
    localLogin(
        @Body() credentials: LocalAuthentication,
        @ReqUser() user: AuthUser
    ): AuthUser {
        return user;
    };





    @ApiBearerAuth()
    @ApiResponse({
        status: 200,
        description: 'You are authorized'
    })
    @ApiResponse({
        status: 401,
        description: 'You are unauthorized'
    })
    @Get('status')
    checkLoginStatus(@Response() res) {
        return res.status(HttpStatus.OK).send();
    }

}
