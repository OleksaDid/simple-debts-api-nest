import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from 'nestjs-typegoose';
import {Id} from '../../../../common/types/types';
import {SendUserDto, UpdateUserDataDto} from '../../models/user.dto';
import {IMAGES_FOLDER_DIR, IMAGES_FOLDER_FILE_PATTERN} from '../../../../common/constants/constants';
import * as Identicon from 'identicon.js';
import * as fs from 'fs';
import {ModelType} from 'typegoose';
import {Debt} from '../../../debts/models/debt';
import {User} from '../../models/user';
import {StorageService} from '../../../firebase/services/storage.service';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(Debt) private readonly Debts: ModelType<Debt>,
    @InjectModel(User) private readonly User: ModelType<User>,
    private _storageService: StorageService
  ) {}



  async getUsersByName(name: string, userId: Id): Promise<SendUserDto[]> {
    const users = await this.User
      .find({
        name: new RegExp(name, 'i'),
        virtual: false
      })
      .limit(15)
      .exec();

    return users
      .filter(user => user.id != userId)
      .map(user => new SendUserDto(user.id, user.name, user.picture));
  }

  async updateUserData(user: SendUserDto, userInfo: UpdateUserDataDto, file?: Express.Multer.File, protocolAndHost?: string): Promise<SendUserDto> {
    if(file) {
      await this._deleteUserFile(user.picture);
      userInfo.picture = await this._uploadUserImage(file.path, file.filename, protocolAndHost);
    }

    const updatedUser = await this.User.findByIdAndUpdate(user.id, userInfo);

    if(!updatedUser) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }

    return new SendUserDto(updatedUser.id, userInfo.name, userInfo.picture || updatedUser.picture);
  };

  async deleteUser(userId: Id): Promise<void> {
    const user = await this.User.findByIdAndRemove(userId);

    if(!user) {
      throw new HttpException('Virtual user is not found', HttpStatus.BAD_REQUEST);
    }

    this._deleteUserFile(user.picture);
  }

  async generateUserIdenticon(userId: Id, protocolAndHost: string): Promise<string> {
    const identiconOptions = {
      background: [255, 255, 255, 255],         // rgba white
      margin: 0.2,                              // 20% margin
      size: 200
    };
    const imgBase64 = new Identicon(userId, identiconOptions).toString();
    const fileName = `${userId}.png`;
    const filePath = `${IMAGES_FOLDER_DIR}/${fileName}`;

    fs.writeFileSync(
      filePath,
      new Buffer(imgBase64, 'base64')
    );

    return this._uploadUserImage(filePath, fileName, protocolAndHost);
  }

  async addPushToken(userId: Id, token: string): Promise<void> {
    await this.User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {pushTokens: token}
      }
    )
  }



  private async _uploadUserImage(filePath: string, fileName: string, protocolAndHost: string): Promise<string> {
    return this._storageService.uploadFile(filePath, fileName, `${IMAGES_FOLDER_DIR}/${fileName}`, protocolAndHost);
  }

  private async _deleteUserFile(fileUrl: string): Promise<void> {
    const imageName = fileUrl.match(IMAGES_FOLDER_FILE_PATTERN)[0];
    return this._storageService.deleteFile(imageName);
  }
}
