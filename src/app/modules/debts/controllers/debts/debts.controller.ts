import {Controller, Get, Param, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {DebtsService} from '../../services/debts/debts.service';
import {ApiBearerAuth, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {ReqUser} from '../../../../common/decorators/request-user.decorator';
import {SendUserDto} from '../../../users/models/user.dto';
import {DebtResponseDto} from '../../models/debt-response.dto';
import {IdParamDto} from '../../../../common/classes/id-param.dto';
import {DebtsListDto} from '../../models/debt.dto';

@ApiBearerAuth()
@ApiUseTags('debts')
@Controller('debts')
export class DebtsController {


  constructor(
    private readonly debtsService: DebtsService
  ) {}


    /*
     * GET
     * /debts
     */
    @ApiResponse({
        status: 200,
        type: DebtsListDto
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @UseGuards(AuthGuard())
    @Get()
    async getAllUserDebts(
        @ReqUser() user: SendUserDto
    ) {
      return this.debtsService.getAllUserDebts(user.id);
    }

    /*
    * GET
    * /debts/:id
    */
    @ApiResponse({
        status: 200,
        type: DebtResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request'
    })
    @UseGuards(AuthGuard())
    @Get(':id')
    async getDebtsById(
        @Param() params: IdParamDto,
        @ReqUser() user: SendUserDto
    ) {
        return this.debtsService.getDebtsById(user.id, params.id)
    }
}
