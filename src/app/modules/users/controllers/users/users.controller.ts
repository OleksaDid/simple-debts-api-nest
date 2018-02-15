import {Body, Controller, Get, Post, Query, Req} from '@nestjs/common';
import {UsersService} from '../../services/users/users.service';
import {SendUserDto, UpdateUserDataDto} from '../../user.dto';
import {ImagesHelper} from '../../../../common/classes/images-helper';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {Request} from 'express';
import {NotEmptyPipe} from '../../../../pipes/not-empty.pipe';

@Controller('users')
export class UsersController {

    constructor(
        private readonly usersService: UsersService
    ) {}


    /*
     * GET
     * /users
     * @query name String String to search users by name
     */
    @Get()
    getUsersArrayByName(
        @Query('name', new NotEmptyPipe()) userName: string,
        @ReqUser() user: SendUserDto
    ) {
        return this.usersService.getUsersByName(userName, user.id);
    }



    /*
     * POST
     * /users
     * @header Content-Type multipart/form-data
     * @param name String Name of user
     * @param image File User's avatar
     */
    @Post()
    updateUserData(
        @Body('name', new NotEmptyPipe()) userName: string,
        @ReqUser() user: SendUserDto,
        @Req() req: Request
    ) {
        const fileName = (req['file'] && req['file'].filename) ? req['file'].filename : null;

        const userInfo = new UpdateUserDataDto(
            userName,
            fileName ? ImagesHelper.getImagesPath(req) + fileName : null
        );

        return this.usersService.updateUserData(user.id, userInfo);
    }

}
