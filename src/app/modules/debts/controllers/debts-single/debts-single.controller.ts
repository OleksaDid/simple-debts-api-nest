import {Body, Controller, HttpStatus, Param, Post, Req} from '@nestjs/common';
import {ApiUseTags, ApiBearerAuth, ApiResponse} from '@nestjs/swagger';
import {DebtsService} from '../../services/debts/debts.service';
import {CreateDebtSingleDto} from '../../models/create-debt-single.dto';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {SendUserDto} from '../../../users/models/user.dto';
import {ImagesHelper} from '../../../../common/classes/images-helper';
import {DebtResponseDto} from '../../models/debt-response.dto';
import {IdParamDto} from '../../../../common/classes/id-param.dto';
import {ConnectUserDto} from '../../models/connect-user.dto';
import {HttpWithRequestException} from '../../../../services/error-handler/http-with-request.exception';
import {DebtsSingleService} from '../../services/debts-single/debts-single.service';

@ApiBearerAuth()
@ApiUseTags('debts/single')
@Controller('debts/single')
export class DebtsSingleController {


  constructor(
      private readonly debtsService: DebtsService,
      private readonly debtsSingleService: DebtsSingleService
  ) {}



    @ApiResponse({
        status: 201,
        type: DebtResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Post()
    async createSingleDebt(
        @Body() createPayload: CreateDebtSingleDto,
        @Req() req,
        @ReqUser() user: SendUserDto
    ) {
      const newDebt = await this.debtsSingleService.createSingleDebt(
          user.id,
          createPayload.userName,
          createPayload.countryCode,
          ImagesHelper.getImagesPath(req)
      );

      return this.debtsService.getDebtsById(user.id, newDebt._id);
    }



    @ApiResponse({
        status: 201,
        type: DebtResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Post(':id/i_love_lsd')
    async acceptUserDeletedStatus(
        @Param() params: IdParamDto,
        @ReqUser() user: SendUserDto
    ) {
        await this.debtsSingleService.acceptUserDeletedStatus(user.id, params.id);

        return this.debtsService.getDebtsById(user.id, params.id);
    }



    @ApiResponse({
        status: 201,
        type: DebtResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Post(':id/connect_user')
    async connectUserToSingleDebt(
        @Param() params: IdParamDto,
        @Body() connectUser: ConnectUserDto,
        @ReqUser() user: SendUserDto
    ) {
        if(user.id.toString() === connectUser.userId.toString()) {
            throw new HttpWithRequestException('You can\'t connect yourself', HttpStatus.BAD_REQUEST);
        }

        await this.debtsSingleService.connectUserToSingleDebt(user.id, connectUser.userId, params.id);

        return this.debtsService.getDebtsById(user.id, params.id);
    }



    @ApiResponse({
        status: 201,
        type: DebtResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Post(':id/connect_user/accept')
    async acceptUserConnection(
        @Param() params: IdParamDto,
        @ReqUser() user: SendUserDto
    ) {
        await this.debtsSingleService.acceptUserConnectionToSingleDebt(user.id, params.id);

        return this.debtsService.getDebtsById(user.id, params.id);
    }


    @ApiResponse({
        status: 201,
        type: DebtResponseDto,
        isArray: true
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @Post(':id/connect_user/decline')
    async declineUserConnection(
        @Param() params: IdParamDto,
        @ReqUser() user: SendUserDto
    ) {
        await this.debtsSingleService.declineUserConnectionToSingleDebt(user.id, params.id);

        return this.debtsService.getAllUserDebts(user.id);
    }
}
