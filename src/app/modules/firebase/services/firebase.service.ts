import {Injectable} from '@nestjs/common';
import {ConfigService} from '../../config/services/config.service';
import {EnvField} from '../../config/models/env-field.enum';
import {storage, messaging} from 'firebase-admin';

let instance = null;

@Injectable()
export class FirebaseService {

  private _fileStorage: storage.Storage;
  private _messaging: messaging.Messaging;

  constructor(
    private _configService: ConfigService
  ) {
    if(!instance){
      instance = this;
      this.initFirebase();
    }

    return instance;
  }


  get storage(): storage.Storage {
    return this._fileStorage;
  }

  get messaging(): messaging.Messaging {
    return this._messaging;
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
    this._messaging = firebase.messaging();
  }

}
