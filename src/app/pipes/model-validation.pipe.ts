import {PipeTransform, ArgumentMetadata, HttpStatus, Injectable, HttpException, Logger} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ModelValidationPipe implements PipeTransform<any> {

    async transform(value: any, { metatype }: ArgumentMetadata) {

        if(!metatype || this._isStandardType(metatype)) {
            return value;
        }

        const object = plainToClass(metatype, value);

        const errors = await validate(object, {validationError: {target: false}});

        if (errors.length > 0) {
            throw new HttpException({message: 'Validation failed', fields: errors}, HttpStatus.BAD_REQUEST);
        }

        return value;
    }



    private _isStandardType(metatype): boolean {
        const types = [String, Boolean, Number, Array, Object];
        return types.includes(metatype);
    }
}
