import {Controller, Post} from '@nestjs/common';
import {AuthUser} from '../../models/auth-user';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';

@Controller('sign_up')
export class SignUpController {


    constructor(
    ) {}


    /*
    * POST
    * /sign-up/local
    * @param email String User's email
    * @param password String User's password must be form 6 to 20 symbols length
     */
    @Post('local')
    localSignUp(@ReqUser() user: AuthUser): AuthUser {
        return user;
    };
}
