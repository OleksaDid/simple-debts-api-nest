import {forwardRef, Module} from '@nestjs/common';
import {OperationsService} from './services/operations.service';
import {OperationsController} from './controllers/operations.controller';
import {DebtsModule} from '../debts/debts.module';
import {OperationsSchema} from './models/operation.schema';
import {MongooseModule} from '@nestjs/mongoose';
import {OperationsCollectionRef} from './models/operation-collection-ref';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: OperationsCollectionRef, schema: OperationsSchema }]),
        forwardRef(() => DebtsModule)
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
