import {ValidationError} from 'class-validator';

export class ResponseError {
    error: any;
    fields?: ValidationError[];

    constructor(error: any) {
        if(error.fields) {
            this.fields = Object.assign({}, error.fields);
            delete error.fields;
        }

        this.error = (error.message || error.error) || error;
    }
}
