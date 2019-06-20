import {HttpException, HttpStatus, Injectable, NestMiddleware} from '@nestjs/common';
import * as multer from 'multer';
import * as path from 'path';
import {IMAGES_FOLDER_DIR} from "../../common/constants/constants";

@Injectable()
export class UploadImageMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: () => void): any {
        const upload = multer({
            storage: this.getMulterStorage(),
            fileFilter: (req, file, callback) => {
                const ext = path.extname(file.originalname);
                const allowedExtensions = ['.png', '.jpg', '.jpeg'];

                if (allowedExtensions.indexOf(ext) === -1) {
                    throw new HttpException('Only images are allowed', HttpStatus.UNSUPPORTED_MEDIA_TYPE);
                }

                callback(null, true);
            },
            fieldSize: 512
        }).single('image');

        upload(req, res, err => {
            if(err) {
                throw new HttpException(err, HttpStatus.EXPECTATION_FAILED);
            }

            next();
        });
    }


  private getMulterStorage() {
      return multer.diskStorage({
          destination: function(req, file, callback) {
              callback(null, IMAGES_FOLDER_DIR);
          },
          filename: function(req, file, callback) {
              callback(null, file.fieldname + '-' + Date.now() + Math.floor((Math.random() * 100)) + path.extname(file.originalname));
          }
      });
  }
}
