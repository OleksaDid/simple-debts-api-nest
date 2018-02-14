import { ExceptionFilter, Catch } from '@nestjs/common';
import {Response} from "express";
import {HttpWithRequestException} from "../services/error-handler/http-with-request.exception";
import {ErrorHandler} from "../services/error-handler/error-handler.service";
import {ResponseError} from "../common/classes/response-error";

@Catch(HttpWithRequestException)
export class HttpWithExceptionFilter implements ExceptionFilter {
    private ErrorHandler = new ErrorHandler();

    catch(exception: HttpWithRequestException, response: Response) {
        const status = exception.getStatus();
        const error = exception.getResponse();
        const request = exception.getRequest();


        this.ErrorHandler.captureError(error, request);

        response.status(status).json(new ResponseError(error));
    }
}