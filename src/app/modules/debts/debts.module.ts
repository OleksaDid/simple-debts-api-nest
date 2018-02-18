import {forwardRef, Module} from '@nestjs/common';
import {DatabaseModule} from "../database/database.module";
import {debtsProviders} from "./debts.providers";
import {UsersModule} from '../users/users.module';
import {DebtsController} from './controllers/debts/debts.controller';
import {DebtsService} from './services/debts/debts.service';
import {OperationsModule} from '../operations/operations.module';
import {DebtsMultipleController} from './controllers/debts-multiple/debts-multiple.controller';
import {DebtsSingleController} from './controllers/debts-single/debts-single.controller';
import {DebtsMultipleService} from './services/debts-multiple/debts-multiple.service';
import {DebtsSingleService} from './services/debts-single/debts-single.service';

@Module({
    modules: [
        DatabaseModule,
        forwardRef(() => UsersModule),
        forwardRef(() => OperationsModule)
    ],
    controllers: [
        DebtsController,
        DebtsMultipleController,
        DebtsSingleController
    ],
    components: [
        ...debtsProviders,
        DebtsService,
        DebtsMultipleService,
        DebtsSingleService
    ],
    exports: [
        ...debtsProviders
    ]
})
export class DebtsModule {}
