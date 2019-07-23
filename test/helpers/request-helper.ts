import * as request from 'supertest';

export class RequestHelper {

  static getImage(imagePath: string) {
    return request('')
      .get(imagePath);
  }

}
