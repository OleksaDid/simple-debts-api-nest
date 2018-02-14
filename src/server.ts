/**
 * Setup environment first of all
 */
import * as dotenv from 'dotenv';

if(!process.env.ENVIRONMENT) {
    dotenv.config({ path: __dirname + '/../config/.env.example' });
}

import * as express from 'express';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as expressValidator from 'express-validator';
import * as passport from 'passport';
import * as helmet from 'helmet';
import * as Ddos from 'ddos';
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app/app.module';
import {INestApplication} from '@nestjs/common/interfaces/nest-application.interface';
import {ErrorHandler} from "./app/services/error-handler/error-handler.service";
import {HttpWithExceptionFilter} from "./app/filters/http-exception.filter";
import {UncaughtExceptionFilter} from "./app/filters/uncaught-exception.filter";

const server = express();

const ddos = new Ddos;
const ErrorHandlerService = new ErrorHandler();

async function bootstrap() {
    const app = await NestFactory.create(ApplicationModule, server);

    // Request handler (setup to interceptors?)
    app.use(ErrorHandlerService.getRequestHandler());


    // General
    app.use(compression());

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(expressValidator());

    app.use(passport.initialize());

    app.use(express.static('public', { maxAge: 31557600000 }));


    // Security
    app.use(helmet());

    app.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"]
        }
    }));

    if(process.env.ENVIRONMENT !== 'LOCAL') {
        app.use(ddos.express);
    }


    // Error handling
    app.use(ErrorHandlerService.getErrorHandler());

    app.useGlobalFilters(new HttpWithExceptionFilter());


    const port = +process.env.PORT || 10010;
    await app.listen(port);
}

bootstrap();
