import {Module} from '@nestjs/common';
import {AuthenticationModule} from "./modules/authentication/authentication.module";
import {UsersModule} from './modules/users/users.module';
import {DebtsModule} from './modules/debts/debts.module';

@Module({
    modules: [
        AuthenticationModule,
        UsersModule,
        DebtsModule
    ]
})
export class ApplicationModule {}