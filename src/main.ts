/**
 * Setup environment first of all
 */
import * as dotenv from 'dotenv';
import {EnvField} from './app/modules/config/models/env-field.enum';

if(!process.env[EnvField.NODE_ENV]) {
    dotenv.config({ path: __dirname + '/../config/local.env' });
}

import * as express from 'express';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as expressValidator from 'express-validator';
import * as helmet from 'helmet';
import * as Ddos from 'ddos';
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app/app.module';
import {ErrorHandler} from "./app/services/error-handler/error-handler.service";
import {HttpWithExceptionFilter} from "./app/filters/http-exception.filter";
import {ModelValidationPipe} from './app/pipes/model-validation.pipe';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {EnvType} from './app/modules/config/models/env-type.enum';

const ddos = new Ddos;
const ErrorHandlerService = new ErrorHandler();

async function bootstrap() {
    const app = await NestFactory.create(ApplicationModule);

    // Request handler (setup to interceptors?)
    app.use(ErrorHandlerService.getRequestHandler());


    // General
    app.use(compression());

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(expressValidator());

    app.use(express.static('public', { maxAge: 31557600000 }));


    // Security
    app.use(helmet());

    app.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"]
        }
    }));

    if(process.env[EnvField.NODE_ENV] !== EnvType.LOCAL) {
        app.use(ddos.express);
    }


    // Global pipes
    app.useGlobalPipes(new ModelValidationPipe());


    // Error handling
    app.use(ErrorHandlerService.getErrorHandler());

    app.useGlobalFilters(new HttpWithExceptionFilter());

    // Swagger
    const options = new DocumentBuilder()
        .setTitle('Simple Debts')
        .setDescription('Simple Debts API powered by Nest')
        .setVersion('1.0')
        .addBearerAuth('Authorization', 'header')
        .setSchemes('http')
        .setSchemes('https')
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('/api', app, document);


    const port = +process.env[EnvField.PORT] || 10010;
    await app.listen(port);
}

bootstrap();
