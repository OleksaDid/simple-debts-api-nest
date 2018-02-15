import { PipeTransform, Pipe, ArgumentMetadata, HttpStatus } from '@nestjs/common';
import {HttpWithRequestException} from '../services/error-handler/http-with-request.exception';

@Pipe()
export class NotEmptyPipe implements PipeTransform<string> {

    async transform(value: string, metadata: ArgumentMetadata) {
        if (!value) {
            const message = `"${metadata.data}" field in ${metadata.type} should not be empty`;
            throw new HttpWithRequestException(message, HttpStatus.BAD_REQUEST);
        }

        return value;
    }

}