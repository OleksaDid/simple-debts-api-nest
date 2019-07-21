import {forwardRef, Module} from '@nestjs/common';
import {OperationsService} from './services/operations.service';
import {OperationsController} from './controllers/operations.controller';
import {DebtsModule} from '../debts/debts.module';
import {OperationsCollectionRef} from './models/operation-collection-ref';
import {AuthenticationModule} from '../authentication/authentication.module';
import {TypegooseModule} from 'nestjs-typegoose';
import {Operation} from './models/operation';

@Module({
  imports: [
    TypegooseModule.forFeature([{ typegooseClass: Operation, schemaOptions: {collection: OperationsCollectionRef} }]),
    forwardRef(() => DebtsModule),
    forwardRef(() => AuthenticationModule),
  ],
  providers: [
    OperationsService
  ],
  controllers: [
    OperationsController
  ],
  exports: [
    TypegooseModule.forFeature([{ typegooseClass: Operation, schemaOptions: {collection: OperationsCollectionRef} }]),
  ]
})
export class OperationsModule {}
