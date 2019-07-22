import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {FirebaseService} from './firebase.service';
import * as fs from "fs";

@Injectable()
export class StorageService {

  constructor(
    private _firebaseService: FirebaseService
  ) {}


  async uploadFile(filePath: string, fileName: string, destination: string, protocolAndHost: string): Promise<string> {
    const [newFile] = await this._firebaseService.storage.bucket().upload(filePath, {
      destination
    });
    await newFile.makePublic();
    fs.unlinkSync(filePath);
    return `${protocolAndHost}/static/${destination}`;
  }

  async getStaticFile(fileName: string): Promise<Buffer> {
    let file;

    try {
      file = this._firebaseService.storage.bucket().file(fileName);

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
      const file = this._firebaseService.storage.bucket().file(fileName);
      await file.delete();
    } catch(err) {
      new HttpException(err, HttpStatus.BAD_REQUEST)
    }
  }
}
