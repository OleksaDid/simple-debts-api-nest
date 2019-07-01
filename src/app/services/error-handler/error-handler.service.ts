import {EnvType} from '../../modules/config/models/env-type.enum';
import {Logger} from '@nestjs/common';
import {EnvField} from '../../modules/config/models/env-field.enum';
import {Request} from 'express';
import * as Sentry from '@sentry/node';

export class ErrorHandler {

  private static _instance: ErrorHandler;

  constructor() {
    if(ErrorHandler._instance) {
      return ErrorHandler._instance;
    }

    this._setup();

    ErrorHandler._instance = this;
  }



  getRequestHandler() {
    return Sentry.Handlers.requestHandler();
  }

  getErrorHandler(): any {
    return Sentry.Handlers.errorHandler();
  }

  captureError(err: any, req?: Request) {
    let error: string;

    if(typeof err === 'string') {
      error = err;
    } else if(err.message) {
      error = err.message;
    } else {
      error = JSON.stringify(err);
    }

    if(process.env[EnvField.NODE_ENV] !== EnvType.LOCAL) {
      if(req && req['user']) {
        Sentry.configureScope((scope) => {
          scope.setUser({
            email: req['user'].email
          });
        });
      }
      Sentry.captureException(error);
    }

    Logger.error(error);
  }



  private _setup() {
    Sentry.init({
      dsn: process.env[EnvField.SENTRY_LINK],
      environment: process.env[EnvField.NODE_ENV],
    });
  }
}
