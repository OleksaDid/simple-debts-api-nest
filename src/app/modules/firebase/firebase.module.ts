import {forwardRef, Module} from '@nestjs/common';
import {FirebaseService} from './services/firebase.service';
import {StaticController} from './controllers/static.controller';
import {UsersModule} from '../users/users.module';
import {NotificationsService} from './services/notifications.service';
import {StorageService} from './services/storage.service';

@Module({
  imports: [
    forwardRef(() => UsersModule)
  ],
  controllers: [
    StaticController
  ],
  providers: [
    FirebaseService,
    StorageService,
    NotificationsService
  ],
  exports: [
    StorageService,
    NotificationsService
  ],
})
export class FirebaseModule {}
