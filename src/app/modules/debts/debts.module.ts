import {forwardRef, Module} from '@nestjs/common';
import {UsersModule} from '../users/users.module';
import {DebtsController} from './controllers/debts/debts.controller';
import {DebtsService} from './services/debts/debts.service';
import {OperationsModule} from '../operations/operations.module';
import {DebtsMultipleController} from './controllers/debts-multiple/debts-multiple.controller';
import {DebtsSingleController} from './controllers/debts-single/debts-single.controller';
import {DebtsMultipleService} from './services/debts-multiple/debts-multiple.service';
import {DebtsSingleService} from './services/debts-single/debts-single.service';
import {AuthenticationModule} from '../authentication/authentication.module';
import {TypegooseModule} from 'nestjs-typegoose';
import {Debt} from './models/debt';
import {DebtsCollectionRef} from './models/debts-collection-ref';

@Module({
  imports: [
    TypegooseModule.forFeature([{ typegooseClass: Debt, schemaOptions: {timestamps: true, collection: DebtsCollectionRef} }]),
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
    TypegooseModule.forFeature([{ typegooseClass: Debt, schemaOptions: {timestamps: true, collection: DebtsCollectionRef} }]),
    DebtsService
  ]
})
export class DebtsModule {}
