import { Injectable } from '@nestjs/common';
import {getAllISOCodes} from 'iso-country-currency';
import {CommonCurrency} from '../../models/common-currency';

@Injectable()
export class CurrencyService {

  getAllCurrencies(): CommonCurrency[] {
    return getAllISOCodes();
  }

  checkIfValidIsoCode(iso: string): boolean {
    const isoCodes = getAllISOCodes();
    return isoCodes.some(currency => currency.iso == iso);
  }

}
