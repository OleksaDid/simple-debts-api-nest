import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {ConfigService} from '../../config/services/config.service';
import {EnvField} from '../../config/models/env-field.enum';
import {storage} from 'firebase-admin';
import * as fs from "fs";

let instance = null;

@Injectable()
export class FirebaseService {

  private _fileStorage: storage.Storage;

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

  async uploadFile(filePath: string, fileName: string, destination: string, protocolAndHost: string): Promise<string> {
    const [newFile] = await this.storage.bucket().upload(filePath, {
      destination
    });
    await newFile.makePublic();
    fs.unlinkSync(filePath);
    return `${protocolAndHost}/static/${destination}`;
  }

  async getStaticFile(fileName: string): Promise<Buffer> {
    let file;

    try {
      file = this.storage.bucket().file(fileName);

      const [exists] = await file.exists();
      if(!exists) {
        throw new HttpException('This file doesn\'t exist', HttpStatus.NOT_FOUND);
      }

      const [buffer] = await file.download();

      return buffer;
    } catch(err) {
      throw new HttpException('This file doesn\'t exist', HttpStatus.NOT_FOUND);
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const file = this.storage.bucket().file(fileName);
      await file.delete();
    } catch(err) {
      new HttpException(err, HttpStatus.BAD_REQUEST)
    }
  }

}
