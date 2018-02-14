export class ResponseError {
    error: any;

    constructor(error: any) {
        this.error = error.message || error;
    }
}