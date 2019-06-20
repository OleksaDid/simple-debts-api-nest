import {Module} from '@nestjs/common';
import {AuthenticationModule} from './modules/authentication/authentication.module';
import {UsersModule} from './modules/users/users.module';
import {DebtsModule} from './modules/debts/debts.module';
import {OperationsModule} from './modules/operations/operations.module';
import {HealthModule} from './modules/health/health.module';
import {ConfigModule} from './modules/config/config.module';
import {ConfigService} from './modules/config/services/config.service';
import {MongooseModule} from '@nestjs/mongoose';

@Module({
    imports: [
      ConfigModule,
        AuthenticationModule,
        UsersModule,
        DebtsModule,
        OperationsModule,
        HealthModule,
        MongooseModule.forRootAsync({
          useExisting: ConfigService
        })
    ]
})
export class ApplicationModule {}
