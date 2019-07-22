import {Injectable, Logger} from '@nestjs/common';
import {FirebaseService} from './firebase.service';
import {Id} from '../../../common/types/types';
import {FirebaseNotification} from '../models/firebase-notification';
import {FirebaseMessageData} from '../models/firebase-message-data';
import {FirebaseMessage} from '../models/firebase-message';
import {InjectModel} from 'nestjs-typegoose';
import {User} from '../../users/models/user';
import {InstanceType, ModelType} from 'typegoose';
import {Debt} from '../../debts/models/debt';
import {DebtsHelper} from '../../debts/models/debts.helper';

@Injectable()
export class NotificationsService {

  constructor(
    @InjectModel(User) private readonly User: ModelType<User>,
    private _firebaseService: FirebaseService,
  ) {}


  async sendNotification(userId: Id, notification: FirebaseNotification, messageData: FirebaseMessageData): Promise<void> {
    const notificationUser = await this.User.findById(userId);

    if(notificationUser.pushTokens && notificationUser.pushTokens.length > 0) {
      return this._sendMessage(new FirebaseMessage(
        notificationUser.pushTokens,
        notification,
        messageData
      ));
    }
  }

  async sendDebtNotification(debt: InstanceType<Debt>, currentUserId: Id, title: string, body: string): Promise<void> {
    const anotherUserId = DebtsHelper.getAnotherDebtUserId(debt, currentUserId);

    return this.sendNotification(
      anotherUserId.hasOwnProperty('_id') ? anotherUserId['_id'] : anotherUserId,
      new FirebaseNotification(
        title,
        body
      ),
      new FirebaseMessageData(debt.id)
    );
  }


  private async _sendMessage(message: FirebaseMessage): Promise<void> {
    try {
      await this._firebaseService.messaging.sendMulticast(message)
    } catch(err) {
      Logger.error(`Error sending message: ${err}`)
    }
  }
}
