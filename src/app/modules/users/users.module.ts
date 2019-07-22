import {forwardRef, Module} from '@nestjs/common';
import {UsersService} from './services/users/users.service';
import {UsersController} from './controllers/users/users.controller';
import {AuthenticationModule} from '../authentication/authentication.module';
import {DebtsModule} from '../debts/debts.module';
import {UserCollectionRef} from './models/user-collection-ref';
import {FirebaseModule} from '../firebase/firebase.module';
import {MulterModule} from '@nestjs/platform-express';
import {ConfigService} from '../config/services/config.service';
import {TypegooseModule} from 'nestjs-typegoose';
import {User} from './models/user';

@Module({
  imports: [
    TypegooseModule.forFeature([{ typegooseClass: User, schemaOptions: {timestamps: true, collection: UserCollectionRef} }]),
    forwardRef(() => AuthenticationModule),
    forwardRef(() => DebtsModule),
    forwardRef(() => FirebaseModule),
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
    TypegooseModule.forFeature([{ typegooseClass: User, schemaOptions: {timestamps: true, collection: UserCollectionRef} }]),
    UsersService
  ]
})
export class UsersModule {}
