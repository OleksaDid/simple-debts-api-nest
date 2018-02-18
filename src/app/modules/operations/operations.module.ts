import {forwardRef, Module} from '@nestjs/common';
import {DatabaseModule} from "../database/database.module";
import {operationsProviders} from "./operations.providers";
import {OperationsService} from './services/operations.service';
import {OperationsController} from './controllers/operations.controller';
import {DebtsModule} from '../debts/debts.module';

@Module({
    modules: [
        DatabaseModule,
        forwardRef(() => DebtsModule)
    ],
    components: [
        ...operationsProviders,
        OperationsService
    ],
    controllers: [
        OperationsController
    ],
    exports: [
        ...operationsProviders
    ]
})
export class OperationsModule {}
