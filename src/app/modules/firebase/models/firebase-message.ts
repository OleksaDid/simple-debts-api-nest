import {FirebaseNotification} from './firebase-notification';
import {FirebaseMessageData} from './firebase-message-data';
import * as admin from 'firebase-admin';

export class FirebaseMessage implements admin.messaging.MulticastMessage {
  notification: FirebaseNotification;
  data: {debtsId: string};
  tokens: string[];

  constructor(tokens: string[], notification: FirebaseNotification, data: FirebaseMessageData) {
    this.tokens = tokens;
    this.notification = notification;
    this.data = data;
  }
}

