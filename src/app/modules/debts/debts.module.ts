import {forwardRef, Module} from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {UsersModule} from '../users/users.module';
import {DebtsController} from './controllers/debts/debts.controller';
import {DebtsService} from './services/debts/debts.service';
import {OperationsModule} from '../operations/operations.module';
import {DebtsMultipleController} from './controllers/debts-multiple/debts-multiple.controller';
import {DebtsSingleController} from './controllers/debts-single/debts-single.controller';
import {DebtsMultipleService} from './services/debts-multiple/debts-multiple.service';
import {DebtsSingleService} from './services/debts-single/debts-single.service';
import {DebtSchema} from './models/debt.schema';
import {DebtsCollectionRef} from './models/debts-collection-ref';
import {AuthenticationModule} from '../authentication/authentication.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DebtsCollectionRef, schema: DebtSchema }]),
    forwardRef(() => UsersModule),
    forwardRef(() => OperationsModule),
    forwardRef(() => AuthenticationModule),
  ],
  controllers: [
    DebtsController,
    DebtsMultipleController,
    DebtsSingleController
  ],
  providers: [
    DebtsService,
    DebtsMultipleService,
    DebtsSingleService
  ],
  exports: [
    MongooseModule.forFeature([{ name: DebtsCollectionRef, schema: DebtSchema }]),
    DebtsService
  ]
})
export class DebtsModule {}
