import {Module} from '@nestjs/common';
import {DatabaseModule} from "../database/database.module";
import {operationsProviders} from "./operations.providers";

@Module({
    modules: [DatabaseModule],
    components: [
        ...operationsProviders
    ]
})
export class OperationsModule {}
