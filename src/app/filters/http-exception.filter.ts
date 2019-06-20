import {ExceptionFilter, Catch, ArgumentsHost} from '@nestjs/common';
import {Response} from "express";
import {HttpWithRequestException} from "../services/error-handler/http-with-request.exception";
import {ErrorHandler} from "../services/error-handler/error-handler.service";
import {ResponseError} from "../common/classes/response-error";

@Catch(HttpWithRequestException)
export class HttpWithExceptionFilter implements ExceptionFilter<HttpWithRequestException> {
    private ErrorHandler = new ErrorHandler();

    catch(exception: HttpWithRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const error = exception.getResponse();


        this.ErrorHandler.captureError(error, request);

        response.status(status).json(new ResponseError(error));
    }
}
