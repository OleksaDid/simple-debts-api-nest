import {Module} from '@nestjs/common';
import {HealthController} from './controllers/health/health.controller';

@Module({
    controllers: [
        HealthController
    ]
})
export class HealthModule {}
