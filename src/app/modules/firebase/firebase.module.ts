import {Module} from '@nestjs/common';
import {FirebaseService} from './services/firebase.service';
import {StaticController} from './controllers/static.controller';

@Module({
  controllers: [
    StaticController
  ],
  providers: [
    FirebaseService
  ],
  exports: [
    FirebaseService
  ],
})
export class FirebaseModule {}
