import {Module} from '@nestjs/common';
import {AuthenticationModule} from "./modules/authentication/authentication.module";

@Module({
    modules: [
        AuthenticationModule,
    ]
})
export class ApplicationModule {}