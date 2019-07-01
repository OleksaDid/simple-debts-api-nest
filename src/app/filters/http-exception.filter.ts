import {ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus} from '@nestjs/common';
import {Response, Request} from "express";
import {ErrorHandler} from "../services/error-handler/error-handler.service";
import {ResponseError} from "../common/classes/response-error";

@Catch()
export class HttpWithExceptionFilter implements ExceptionFilter {

  private ErrorHandler = new ErrorHandler();

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();


    if(!(exception instanceof HttpException)) {
      this.ErrorHandler.captureError(exception, request);

      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new ResponseError(exception));
    } else {
      const status = exception.getStatus();
      const error = exception.getResponse();

      this.ErrorHandler.captureError(error, request);

      response.status(status).json(new ResponseError(error));
    }
  }
}
