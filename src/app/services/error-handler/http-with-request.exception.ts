import {HttpException} from "@nestjs/core";
import {Request} from "express";
import {HttpStatus} from "@nestjs/common";

export class HttpWithRequestException extends HttpException {
    private _request: Request;

    constructor(error: string | object, status: HttpStatus, request?: Request) {
        super(error, status);
        this._request = request;
    }

    getRequest(): Request {
        return this._request;
    }
}