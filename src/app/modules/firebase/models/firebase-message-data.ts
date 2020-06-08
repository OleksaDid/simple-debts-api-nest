export class FirebaseMessageData {
  debtsId: string;
  readonly click_action = 'FLUTTER_NOTIFICATION_CLICK';

  constructor(debtsId: string) {
    this.debtsId = debtsId;
  }
}
