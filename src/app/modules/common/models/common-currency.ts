import {Currency} from 'iso-country-currency';
import {ApiModelProperty} from '@nestjs/swagger';

export class CommonCurrency implements Currency{
  @ApiModelProperty({
    type: 'string',
    description: 'full country name'
  })
  countryName: string;

  @ApiModelProperty({
    type: 'string',
    description: 'iso country'
  })
  iso: string;

  @ApiModelProperty({
    type: 'string',
    description: 'iso currency'
  })
  currency: string;

  @ApiModelProperty({
    type: 'string',
    description: 'currency symbol'
  })
  symbol: string;

}
