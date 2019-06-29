import {forwardRef, Module} from '@nestjs/common';
import {MongooseModule} from "@nestjs/mongoose";
import {UsersService} from './services/users/users.service';
import {UsersController} from './controllers/users/users.controller';
import {AuthenticationModule} from '../authentication/authentication.module';
import {DebtsModule} from '../debts/debts.module';
import {UserSchema} from './models/user.schema';
import {UserCollectionRef} from './models/user-collection-ref';
import {FirebaseModule} from '../firebase/firebase.module';
import {MulterModule} from '@nestjs/platform-express';
import {ConfigService} from '../config/services/config.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserCollectionRef, schema: UserSchema }]),
    forwardRef(() => AuthenticationModule),
    forwardRef(() => DebtsModule),
    FirebaseModule,
    MulterModule.registerAsync({
      useExisting: ConfigService
    })
  ],
  controllers: [
    UsersController
  ],
  providers: [
    UsersService
  ],
  exports: [
    MongooseModule.forFeature([{ name: UserCollectionRef, schema: UserSchema }]),
    UsersService
  ]
})
export class UsersModule {}
