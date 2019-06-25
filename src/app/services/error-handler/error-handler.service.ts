import * as Raven from 'raven';
import {EnvType} from '../../modules/config/models/env-type.enum';
import {Logger} from '@nestjs/common';
import {EnvField} from '../../modules/config/models/env-field.enum';

// TODO: make an injectable
export class ErrorHandler {

    private _raven;
    private static _instance: ErrorHandler;

    private ravenOptions = {
        environment: process.env[EnvField.NODE_ENV],
        release: process.env[EnvField.SENTRY_RELEASE],
        parseUser: true,
        captureUnhandledRejections: true,
        autoBreadcrumbs: true
    };

    constructor() {
        if(ErrorHandler._instance) {
            return ErrorHandler._instance;
        }

        this._raven = Raven;
        this.setup();

        ErrorHandler._instance = this;
    }



    getRequestHandler = () => {
        return this._raven.requestHandler();
    };

    getErrorHandler = () => {
        return this._raven.errorHandler();
    };

    captureError = (err: any, req?: Request) => {
        let error: string;

        if(typeof err === 'string') {
            error = err;
        } else if(err.message) {
            error = err.message;
        } else {
            error = JSON.stringify(err);
        }

        if(process.env[EnvField.NODE_ENV] !== EnvType.LOCAL) {
            this._raven.captureException(error, {req});
        }

        Logger.error(error);
    };



    private setup = () => {
        this._raven.config(process.env[EnvField.RAVEN_LINK], this.ravenOptions).install();
    };
}
