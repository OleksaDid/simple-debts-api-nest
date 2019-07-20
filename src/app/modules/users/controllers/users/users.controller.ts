import {
    Body,
    Controller,
    Get,
    Post,
    Query, Req,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {UsersService} from '../../services/users/users.service';
import {SendUserDto, UpdateUserDataDto} from '../../models/user.dto';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {UserNameDto} from '../../models/user-name.dto';
import {ApiBearerAuth, ApiResponse, ApiUseTags, ApiImplicitFile, ApiConsumes} from '@nestjs/swagger';
import {FileInterceptor} from '@nestjs/platform-express';
import {Request} from 'express';
import {RequestHelper} from '../../../../common/classes/request-helper';
import {UserTokenDto} from '../../models/user-token.dto';


@ApiBearerAuth()
@ApiUseTags('users')
@Controller('users')
export class UsersController {

  constructor(
    private readonly usersService: UsersService
  ) {}



  @ApiResponse({
    status: 200,
    type: SendUserDto,
    isArray: true
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request'
  })
  @UseGuards(AuthGuard())
  @Get()
  getUsersArrayByName(
    @Query() userNameDto: UserNameDto,
    @ReqUser() user: SendUserDto
  ) {
    return this.usersService.getUsersByName(userNameDto.name, user.id);
  }


  @ApiResponse({
      status: 200,
      type: SendUserDto
  })
  @ApiResponse({
      status: 400,
      description: 'Bad Request'
  })
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'image', required: false, description: 'New user image (png, jpg, jpeg). Max size: 512KB' })
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('image'))
  @Post()
  updateUserData(
    @Req() req: Request,
    @Body() userNameDto: UpdateUserDataDto,
    @UploadedFile() file: Express.Multer.File,
    @ReqUser() user: SendUserDto
  ) {
      return this.usersService.updateUserData(user, userNameDto, file, RequestHelper.getFormattedHostAndProtocol(req));
  }



  @ApiResponse({
    status: 201
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request'
  })
  @UseGuards(AuthGuard())
  @Post('push_tokens')
  addDeviceToken(
    @Body() userTokenDto: UserTokenDto,
    @ReqUser() user: SendUserDto
  ) {
    return this.usersService.addPushToken(user.id, userTokenDto.token);
  }

}
