import {forwardRef, Module} from '@nestjs/common';
import {OperationsService} from './services/operations.service';
import {OperationsController} from './controllers/operations.controller';
import {DebtsModule} from '../debts/debts.module';
import {OperationsSchema} from './models/operation.schema';
import {MongooseModule} from '@nestjs/mongoose';
import {OperationsCollectionRef} from './models/operation-collection-ref';
import {AuthenticationModule} from '../authentication/authentication.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OperationsCollectionRef, schema: OperationsSchema }]),
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
    MongooseModule.forFeature([{ name: OperationsCollectionRef, schema: OperationsSchema }]),
  ]
})
export class OperationsModule {}
