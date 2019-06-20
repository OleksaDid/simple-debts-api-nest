import {PipeTransform, ArgumentMetadata, HttpStatus, Injectable, HttpException} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ModelValidationPipe implements PipeTransform<any> {

    async transform(value, metadata: ArgumentMetadata) {
        const { metatype } = metadata;

        if (!metatype || this.standardType(metatype)) {
            return value;
        }

        const object = plainToClass(metatype, JSON.parse(JSON.stringify(value)));

        const errors = await validate(object, { validationError: { target: false } });
        if (errors.length > 0) {
            throw new HttpException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
        }

        return value;
    }



    private standardType(metatype): boolean {
        const types = [String, Boolean, Number, Array, Object];
        return !!types.find((type) => metatype === type);
    }
}
