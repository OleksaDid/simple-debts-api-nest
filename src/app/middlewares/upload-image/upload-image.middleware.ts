import {HttpStatus, Middleware, NestMiddleware} from '@nestjs/common';
import * as multer from 'multer';
import * as path from 'path';
import {IMAGES_FOLDER_DIR} from "../../common/constants/constants";
import {HttpWithRequestException} from "../../services/error-handler/http-with-request.exception";

@Middleware()
export class UploadImageMiddleware implements NestMiddleware {
  resolve(): (req, res, next) => void {
      return (req, res, next) => {
          const upload = multer({
              storage: this.getMulterStorage(),
              fileFilter: (req, file, callback) => {
                  const ext = path.extname(file.originalname);
                  const allowedExtensions = ['.png', '.jpg', '.jpeg'];

                  if (allowedExtensions.indexOf(ext) === -1) {
                      throw new HttpWithRequestException('Only images are allowed', HttpStatus.UNSUPPORTED_MEDIA_TYPE, req);
                  }

                  callback(null, true);
              },
              fieldSize: 512
          }).single('image');

          upload(req, res, err => {
              if(err) {
                  throw new HttpWithRequestException(err, HttpStatus.EXPECTATION_FAILED, req);
              }

              next();
          });
      }
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