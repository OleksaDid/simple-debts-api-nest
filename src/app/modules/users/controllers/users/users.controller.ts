import {Body, Controller, Get, Post, Query} from '@nestjs/common';
import {UsersService} from '../../services/users/users.service';
import {SendUserDto, UpdateUserDataDto} from '../../models/user.dto';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {UploadedImagePath} from '../../../../common/decorators/uploaded-image-path.decorator';
import {UserNameDto} from '../../models/user-name.dto';
import {ApiBearerAuth, ApiResponse, ApiUseTags} from '@nestjs/swagger';


@ApiBearerAuth()
@ApiUseTags('users')
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
    @ApiResponse({
        status: 200,
        type: SendUserDto,
        isArray: true
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Get()
    getUsersArrayByName(
        @Query() userNameDto: UserNameDto,
        @ReqUser() user: SendUserDto
    ) {
        return this.usersService.getUsersByName(userNameDto.name, user.id);
    }



    /*
     * POST
     * /users
     * @header Content-Type multipart/form-data
     * @param name String Name of user
     * @param image File User's avatar
     */
    @ApiResponse({
        status: 200,
        type: SendUserDto
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Post()
    updateUserData(
        @Body() userNameDto: UpdateUserDataDto,
        @UploadedImagePath() filePath: string,
        @ReqUser() user: SendUserDto
    ) {
        const userInfo = new UpdateUserDataDto(userNameDto.name, filePath);

        return this.usersService.updateUserData(user.id, userInfo);
    }

}
