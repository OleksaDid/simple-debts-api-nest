import {Module} from '@nestjs/common';
import {usersProviders} from "./users.providers";
import {DatabaseModule} from "../database/database.module";

@Module({
    modules: [DatabaseModule],
    components: [
        ...usersProviders
    ],
    exports: [...usersProviders]
})
export class UsersModule {}
