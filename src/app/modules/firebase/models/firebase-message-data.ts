export class FirebaseMessageData {
  debtsId: string;
  click_action = 'FLUTTER_NOTIFICATION_CLICK';

  constructor(debtsId: string) {
    this.debtsId = debtsId;
  }
}
