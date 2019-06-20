import {createParamDecorator} from '@nestjs/common';
import {ImagesHelper} from '../classes/images-helper';

export const UploadedImagePath = createParamDecorator((data, req) => {
    const fileName = (req['file'] && req['file'].filename) ? req['file'].filename : null;
    return fileName ? ImagesHelper.getImagesPath(req) + fileName : null;
});
