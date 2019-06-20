import {Global, Module} from '@nestjs/common';
import { ConfigService } from './services/config.service';
import {EnvField} from './models/env-field.enum';

@Global()
@Module({
  providers: [
    {
      provide: ConfigService,
      useValue: new ConfigService(`${__dirname}/../../../../config/${process.env[EnvField.NODE_ENV]}.env`),
    },
  ],
  exports: [ConfigService],
})
export class ConfigModule {}
