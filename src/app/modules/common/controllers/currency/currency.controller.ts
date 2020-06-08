import {Controller, Get, UseGuards} from '@nestjs/common';
import {CurrencyService} from '../../services/currency/currency.service';
import {ApiResponse} from '@nestjs/swagger';
import {CommonCurrency} from '../../models/common-currency';
import {AuthGuard} from '@nestjs/passport';

@Controller('common/currency')
export class CurrencyController {

  constructor(
    private readonly _currencyService: CurrencyService
  ) {}


  /*
   * GET
   * /common/currency
   */
  @ApiResponse({
    status: 200,
    type: CommonCurrency,
    isArray: true
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request'
  })
  @UseGuards(AuthGuard())
  @Get()
  async getAllUserDebts() {
    return this._currencyService.getAllCurrencies();
  }
}
