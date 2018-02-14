import * as Raven from 'raven';
import { Request } from 'express';

export class ErrorHandler {

    private _raven;
    private static _instance: ErrorHandler;

    private ravenOptions = {
        environment: process.env.ENVIRONMENT,
        release: process.env.SENTRY_RELEASE,
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

        if(process.env.ENVIRONMENT !== 'LOCAL') {
            this._raven.captureException(error, {req});
        }

        console.log(error);
    };



    private setup = () => {
        this._raven.config(process.env.RAVEN_LINK, this.ravenOptions).install();
    };
}
