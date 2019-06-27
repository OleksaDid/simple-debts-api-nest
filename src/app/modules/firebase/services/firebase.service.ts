import {Injectable} from '@nestjs/common';
import {ConfigService} from '../../config/services/config.service';
import {EnvField} from '../../config/models/env-field.enum';
import {storage} from 'firebase-admin';

@Injectable()
export class FirebaseService {

  private _fileStorage: storage.Storage;

  constructor(
    private _configService: ConfigService
  ) {}


  get storage(): storage.Storage {
    return this._fileStorage;
  }


  initFirebase(): void {
    const firebase = require("firebase-admin");
    const firebaseFilePath = `${this._configService.configDirectoryPath}/${this._configService.get(EnvField.FIREBASE_FILE)}`;
    const serviceAccount = require(firebaseFilePath);

    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount),
      databaseURL: this._configService.get(EnvField.FIREBASE_URL),
      storageBucket: this._configService.get(EnvField.FIREBASE_BUCKET)
    });

    this._fileStorage = firebase.storage();
  }

}
