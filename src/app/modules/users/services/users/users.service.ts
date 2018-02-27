import {Component, HttpStatus, Inject} from '@nestjs/common';
import {Id} from '../../../../common/types/types';
import {SendUserDto, UpdateUserDataDto} from '../../models/user.dto';
import {DebtInterface} from '../../../debts/models/debt.interface';
import {Model} from 'mongoose';
import {UserInterface} from '../../models/user.interface';
import {HttpWithRequestException} from '../../../../services/error-handler/http-with-request.exception';
import {IMAGES_FOLDER_FILE_PATTERN} from '../../../../common/constants/constants';
import * as fs from 'fs';
import {UsersProvider} from '../../users-providers.enum';
import {DebtsProvider} from '../../../debts/debts-providers.enum';

@Component()
export class UsersService {

    constructor(
        @Inject(DebtsProvider.DebtsModelToken) private readonly Debts: Model<DebtInterface>,
        @Inject(UsersProvider.UsersModelToken) private readonly User: Model<UserInterface>,
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
            throw new HttpWithRequestException('User not found', HttpStatus.BAD_REQUEST);
        }

        return new SendUserDto(updatedUser.id, userInfo.name, userInfo.picture || updatedUser.picture);
    };

    public async deleteUser(userId: Id): Promise<void> {
        const user = await this.User.findByIdAndRemove(userId);

        if(!user) {
            throw new HttpWithRequestException('Virtual user is not found', HttpStatus.BAD_REQUEST);
        }

        const imageName = user.picture.match(IMAGES_FOLDER_FILE_PATTERN);

        fs.unlinkSync('public' + imageName);
    }
}
