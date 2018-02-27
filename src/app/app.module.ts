import {Module} from '@nestjs/common';
import {AuthenticationModule} from "./modules/authentication/authentication.module";
import {UsersModule} from './modules/users/users.module';
import {DebtsModule} from './modules/debts/debts.module';
import {OperationsModule} from './modules/operations/operations.module';
import {HealthModule} from './modules/health/health.module';

@Module({
    modules: [
        AuthenticationModule,
        UsersModule,
        DebtsModule,
        OperationsModule,
        HealthModule
    ]
})
export class ApplicationModule {}