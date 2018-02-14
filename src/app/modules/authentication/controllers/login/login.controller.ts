import * as passport from 'passport';
import {Controller, Get, HttpStatus, Next, Response, Request, Post, Body} from '@nestjs/common';
import {AuthenticationService} from "../../services/authentication/authentication.service";
import {SendUserDto} from "../../../users/user.dto";
import {HttpWithRequestException} from "../../../../services/error-handler/http-with-request.exception";
import {LoginLocalDto} from "../../models/local-authentication";
import {AuthUser} from '../../models/auth-user';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';

@Controller('login')
export class LoginController {


    constructor(
    ) { }



    /*
    * GET
    * /login/facebook
    * @header Authorization Must contain 'Bearer <FB_TOKEN>' //TODO: Swagger header
     */
    @Get('facebook')
    facebookLogin(@ReqUser() user: AuthUser): AuthUser {
        return user;
    };

    /*
    * GET
    * login/refresh_token
    * @header Authorization Must contain 'Bearer <REFRESH_TOKEN>'
    */
    @Get('refresh_token')
    refreshToken(@ReqUser() user: AuthUser): AuthUser {
        return user;
    };

    /*
     * POST
     * /login/local
     * @param email String User's email
     * @param password String User's password
     */
    @Post('local')
    localLogin(@ReqUser() user: AuthUser): AuthUser {
        return user;
    };


    /**
     * GET /login/status
     * @param {Response} res
     */
    @Get('status')
    checkLoginStatus(@Response() res) {
        return res.status(HttpStatus.OK).send();
    }

}
