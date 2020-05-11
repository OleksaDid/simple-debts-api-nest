import {Module} from '@nestjs/common';
import {AuthenticationModule} from './modules/authentication/authentication.module';
import {UsersModule} from './modules/users/users.module';
import {DebtsModule} from './modules/debts/debts.module';
import {OperationsModule} from './modules/operations/operations.module';
import {HealthModule} from './modules/health/health.module';
import {ConfigModule} from './modules/config/config.module';
import {ConfigService} from './modules/config/services/config.service';
import {TypegooseModule} from 'nestjs-typegoose';
import { CommonModule } from './modules/common/common.module';

@Module({
  imports: [
    TypegooseModule.forRootAsync({
      useExisting: ConfigService
    }),
    ConfigModule,
    AuthenticationModule,
    UsersModule,
    OperationsModule,
    DebtsModule,
    HealthModule,
    CommonModule,
  ]
})
export class ApplicationModule {}
