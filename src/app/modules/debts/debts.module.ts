import {Module} from '@nestjs/common';
import {DatabaseModule} from "../database/database.module";
import {debtsProviders} from "./debts.providers";

@Module({
    modules: [DatabaseModule],
    components: [
        ...debtsProviders
    ]
})
export class DebtsModule {}
