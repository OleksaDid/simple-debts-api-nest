import {ExceptionFilter, Catch, HttpStatus} from '@nestjs/common';
import {Response} from "express";
import {ResponseError} from "../common/classes/response-error";
import {HttpWithRequestException} from "../services/error-handler/http-with-request.exception";

@Catch()
export class UncaughtExceptionFilter implements ExceptionFilter {
    catch(exception: any, response: Response) {
        if(!(exception instanceof HttpWithRequestException)) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(new ResponseError(exception));
        }
    }
}