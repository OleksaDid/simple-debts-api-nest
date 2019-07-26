import {Body, Controller, Delete, HttpException, HttpStatus, Param, Post, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiBearerAuth, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {DebtResponseDto} from '../../models/debt-response.dto';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {CreateDebtDto} from '../../models/create-debt.dto';
import {SendUserDto} from '../../../users/models/user.dto';
import {DebtsService} from '../../services/debts/debts.service';
import {IdParamDto} from '../../../../common/classes/id-param.dto';
import {DebtsMultipleService} from '../../services/debts-multiple/debts-multiple.service';


@ApiBearerAuth()
@ApiUseTags('debts/multiple')
@Controller('debts/multiple')
export class DebtsMultipleController {



  constructor(
    private readonly debtsService: DebtsService,
    private readonly debtsMultipleService: DebtsMultipleService
  ) {}




  @ApiResponse({
    status: 200,
    type: DebtResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request'
  })
  @UseGuards(AuthGuard())
  @Delete(':id')
  async deleteDebt(
    @Param() params: IdParamDto,
    @ReqUser() user: SendUserDto
  ) {
    await this.debtsMultipleService.deleteMultipleDebts(params.id, user);

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
  @Post()
  async createNewDebt(
      @Body() createDebtDto: CreateDebtDto,
      @ReqUser() user: SendUserDto
  ): Promise<DebtResponseDto> {
    if(user.id == createDebtDto.userId) {
      throw new HttpException('You cannot create Debts with yourself', HttpStatus.BAD_REQUEST);
    }

    const newDebt = await this.debtsMultipleService.createMultipleDebt(user, createDebtDto.userId, createDebtDto.currency);

    return this.debtsService.getDebtsById(user.id, newDebt._id);
  };



  @ApiResponse({
    status: 201,
    type: DebtResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request'
  })
  @UseGuards(AuthGuard())
  @Post(':id/creation/accept')
  async acceptCreation(
      @Param() params: IdParamDto,
      @ReqUser() user: SendUserDto
  ) {
    await this.debtsMultipleService.acceptDebtsCreation(user, params.id);

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
  @Post(':id/creation/decline')
  async declineCreation(
      @Param() params: IdParamDto,
      @ReqUser() user: SendUserDto
  ) {
    await this.debtsMultipleService.declineDebtsCreation(user, params.id);

    return this.debtsService.getAllUserDebts(user.id);
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
  @Post(':id/accept_all_operations')
  async acceptAllOperations(
      @Param() params: IdParamDto,
      @ReqUser() user: SendUserDto
  ) {
    await this.debtsMultipleService.acceptAllDebtOperations(user, params.id);

    return this.debtsService.getDebtsById(user.id, params.id);
  }
}
