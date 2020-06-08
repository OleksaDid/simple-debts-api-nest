import { Module } from '@nestjs/common';
import { CurrencyController } from './controllers/currency/currency.controller';
import { CurrencyService } from './services/currency/currency.service';
import {AuthenticationModule} from '../authentication/authentication.module';

@Module({
  imports: [AuthenticationModule],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService]
})
export class CommonModule {}
