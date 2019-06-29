import {Body, Controller, HttpException, HttpStatus, Param, Post, Req, UseGuards} from '@nestjs/common';
import {Request} from 'express';
import {AuthGuard} from '@nestjs/passport';
import {ApiUseTags, ApiBearerAuth, ApiResponse} from '@nestjs/swagger';
import {DebtsService} from '../../services/debts/debts.service';
import {CreateDebtSingleDto} from '../../models/create-debt-single.dto';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {SendUserDto} from '../../../users/models/user.dto';
import {DebtResponseDto} from '../../models/debt-response.dto';
import {IdParamDto} from '../../../../common/classes/id-param.dto';
import {ConnectUserDto} from '../../models/connect-user.dto';
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
    @UseGuards(AuthGuard())
    @Post()
    async createSingleDebt(
        @Body() createPayload: CreateDebtSingleDto,
        @Req() req: Request,
        @ReqUser() user: SendUserDto
    ) {
      const newDebt = await this.debtsSingleService.createSingleDebt(
        user.id,
        createPayload.userName,
        createPayload.currency,
        `${req.protocol}/${req.hostname}`,
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
    @UseGuards(AuthGuard())
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
    @UseGuards(AuthGuard())
    @Post(':id/connect_user')
    async connectUserToSingleDebt(
        @Param() params: IdParamDto,
        @Body() connectUser: ConnectUserDto,
        @ReqUser() user: SendUserDto
    ) {
        if(user.id.toString() === connectUser.userId.toString()) {
            throw new HttpException('You can\'t connect yourself', HttpStatus.BAD_REQUEST);
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
    @UseGuards(AuthGuard())
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
    @UseGuards(AuthGuard())
    @Post(':id/connect_user/decline')
    async declineUserConnection(
        @Param() params: IdParamDto,
        @ReqUser() user: SendUserDto
    ) {
        await this.debtsSingleService.declineUserConnectionToSingleDebt(user.id, params.id);

        return this.debtsService.getAllUserDebts(user.id);
    }
}
