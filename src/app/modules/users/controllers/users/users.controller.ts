import {Body, Controller, Get, Post, Query} from '@nestjs/common';
import {UsersService} from '../../services/users/users.service';
import {SendUserDto, UpdateUserDataDto} from '../../user.dto';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {NotEmptyPipe} from '../../../../pipes/not-empty.pipe';
import {UploadedImagePath} from '../../../../common/decorators/uploaded-image-path.decorator';

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
        @UploadedImagePath() filePath: string,
        @ReqUser() user: SendUserDto
    ) {
        const userInfo = new UpdateUserDataDto(userName, filePath);

        return this.usersService.updateUserData(user.id, userInfo);
    }

}
