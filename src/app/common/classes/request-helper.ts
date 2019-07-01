import {Request} from 'express';

export class RequestHelper {

  static getFormattedHostAndProtocol(req: Request): string {
    return `${req.protocol}://${req.hostname}`;
  }

}
