import {Body, Controller, Delete, HttpStatus, Param, Post} from '@nestjs/common';
import {ApiBearerAuth, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {DebtResponseDto} from '../../models/debt-response.dto';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {CreateDebtDto} from '../../models/create-debt.dto';
import {SendUserDto} from '../../../users/models/user.dto';
import {HttpWithRequestException} from '../../../../services/error-handler/http-with-request.exception';
import {DebtsService} from '../../services/debts/debts.service';
import {IdParamDto} from '../../../../common/classes/id-param.dto';
import {DebtsMultipleService} from '../../services/debts-multiple/debts-multiple.service';


@ApiBearerAuth()
@ApiUseTags('debts_multiple')
@Controller('debts_multiple')
export class DebtsMultipleController {



  constructor(
      private readonly debtsService: DebtsService,
      private readonly debtsMultipleService: DebtsMultipleService,
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
    async createNewDebt(
        @Body() createDebtDto: CreateDebtDto,
        @ReqUser() user: SendUserDto
    ): Promise<DebtResponseDto> {
        if(user.id == createDebtDto.userId) {
            throw new HttpWithRequestException('You cannot create Debts with yourself', HttpStatus.BAD_REQUEST);
        }

        const newDebt = await this.debtsMultipleService.createMultipleDebt(user.id, createDebtDto.userId, createDebtDto.countryCode);

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
    @Post(':id/creation-accept')
    async acceptCreation(
        @Param() params: IdParamDto,
        @ReqUser() user: SendUserDto
    ) {
        await this.debtsMultipleService.acceptDebtsCreation(user.id, params.id);

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
    @Post(':id/creation-decline')
    async declineCreation(
        @Param() params: IdParamDto,
        @ReqUser() user: SendUserDto
    ) {
        await this.debtsMultipleService.declineDebtsCreation(user.id, params.id);

        return this.debtsService.getAllUserDebts(user.id);
    }
}