import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {FirebaseService} from './firebase.service';
import * as fs from "fs";

@Injectable()
export class StorageService {

  private readonly _metadata = {
    cacheControl: 'public, max-age=360000'
  };

  constructor(
    private _firebaseService: FirebaseService
  ) {
    this.setupMetadata();
  }


  setupMetadata(): void {
    this._firebaseService.storage.bucket().setMetadata(this._metadata);
  }

  async uploadFile(filePath: string, destination: string): Promise<string> {
    const [newFile] = await this._firebaseService.storage.bucket().upload(filePath, {
      metadata: this._metadata,
      destination
    });

    fs.unlinkSync(filePath);

    const [fileUrl] = await newFile.getSignedUrl({
      action: 'read',
      expires: new Date('12-12-2050')
    });

    return fileUrl + '&timestamp=' + Date.now();
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
