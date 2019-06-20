import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Id} from '../../../../common/types/types';
import {SendUserDto, UpdateUserDataDto} from '../../models/user.dto';
import {DebtInterface} from '../../../debts/models/debt.interface';
import {Model} from 'mongoose';
import {UserInterface} from '../../models/user.interface';
import {IMAGES_FOLDER_FILE_PATTERN} from '../../../../common/constants/constants';
import * as fs from 'fs';
import {DebtsCollectionRef} from '../../../debts/models/debts-collection-ref';
import {UserCollectionRef} from '../../models/user-collection-ref';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(DebtsCollectionRef) private readonly Debts: Model<DebtInterface>,
    @InjectModel(UserCollectionRef) private readonly User: Model<UserInterface>,
  ) {}



  public async getUsersByName(name: string, userId: Id): Promise<SendUserDto[]> {
    const debts = await this.Debts
      .find({'users': {'$all': [userId]}})
      .populate({ path: 'users', select: 'name picture'})
      .exec();

    const usedUserIds = debts
      .map(debt => debt.users.find(user => user['id'].toString() != userId)['id']);

    const users = await this.User
      .find({
        name: new RegExp(name, 'i'),
        virtual: false
      })
      .limit(15)
      .exec();

    return users
      .filter(user => user.id != userId && !usedUserIds.find(id => user.id == id))
      .map(user => new SendUserDto(user.id, user.name, user.picture));
  }

  public async updateUserData(userId: Id, userInfo: UpdateUserDataDto): Promise<SendUserDto> {
    const updatedUser = await this.User
      .findByIdAndUpdate(userId, userInfo);

    if(!updatedUser) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }

    return new SendUserDto(updatedUser.id, userInfo.name, userInfo.picture || updatedUser.picture);
  };

  public async deleteUser(userId: Id): Promise<void> {
    const user = await this.User.findByIdAndRemove(userId);

    if(!user) {
      throw new HttpException('Virtual user is not found', HttpStatus.BAD_REQUEST);
    }

    const imageName = user.picture.match(IMAGES_FOLDER_FILE_PATTERN);

    fs.unlinkSync('public' + imageName);
  }
}
