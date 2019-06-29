import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import * as fs from 'fs';
import {EnvConfig} from '../models/env-config.interface';
import {EnvType} from '../models/env-type.enum';
import {EnvField} from '../models/env-field.enum';
import {MongooseModuleOptions, MongooseOptionsFactory} from '@nestjs/mongoose';
import {MulterModuleOptions, MulterOptionsFactory} from '@nestjs/platform-express';
import * as path from "path";
import {HttpException, HttpStatus} from '@nestjs/common';
import * as multer from 'multer';
import {IMAGES_FOLDER_DIR} from '../../../common/constants/constants';
import {existsSync, mkdirSync} from 'fs';

export class ConfigService implements MongooseOptionsFactory, MulterOptionsFactory {

  private readonly _envConfig: EnvConfig;
  private readonly _configDirectoryPath: string;

  constructor(configDirectoryPath: string) {
    this._configDirectoryPath = configDirectoryPath;

    const configFilePath = `${this.configDirectoryPath}/${process.env[EnvField.NODE_ENV]}.env`;
    const config = dotenv.parse(fs.readFileSync(configFilePath));
    this._envConfig = this._validateInput(config);
  }



  get(field: EnvField): string {
    return this._envConfig[field];
  }

  get configDirectoryPath(): string {
    return this._configDirectoryPath;
  }

  createMongooseOptions(): Promise<MongooseModuleOptions> | MongooseModuleOptions {
    const isLocalEnv = this.get(EnvField.NODE_ENV) === EnvType.LOCAL;

    return {
      uri: isLocalEnv ? this.get(EnvField.MONGODB_URI) : this.get(EnvField.MONGOLAB_URI),
      useNewUrlParser: !isLocalEnv
    };
  }

  createMulterOptions(): Promise<MulterModuleOptions> | MulterModuleOptions {
    return {
      storage: multer.diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = `./${IMAGES_FOLDER_DIR}/`;

          // Create folder if doesn't exist
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath);
          }

          callback(null, uploadPath);
        },
        filename: (req, file: Express.Multer.File, callback) => {
          callback(null, file.fieldname + '-' + Date.now() + '-' + Math.floor((Math.random() * 1000)) + path.extname(file.originalname));
        }
      }),
      limits: {
        fileSize: 512000
      },
      fileFilter(req: any, file: { fieldname: string; originalname: string; encoding: string; mimetype: string; size: number; destination: string; filename: string; path: string; buffer: Buffer }, callback: (error: (Error | null), acceptFile: boolean) => void): void {
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.png', '.jpg', '.jpeg'];

        if (allowedExtensions.indexOf(ext) === -1) {
          callback(new HttpException('Only images are allowed', HttpStatus.UNSUPPORTED_MEDIA_TYPE), false);
        }

        callback(null, true);
      }
    };
  }




  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private _validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      [EnvField.NODE_ENV]: Joi.string()
        .valid([EnvType.DEV, EnvType.PROD, EnvType.TEST, EnvType.LOCAL])
        .default(EnvType.DEV),
      [EnvField.PORT]: Joi.number().default(10010),
      [EnvField.MONGODB_URI]: Joi.string().required(),
      [EnvField.MONGOLAB_URI]: Joi.string().required(),
      [EnvField.RAVEN_LINK]: Joi.string().required(),
      [EnvField.REFRESH_JWT_SECRET]: Joi.string().required(),
      [EnvField.SENTRY_RELEASE]: Joi.string(),
      [EnvField.JWT_SECRET]: Joi.string().required(),
      [EnvField.FACEBOOK_ID]: Joi.string().required(),
      [EnvField.FACEBOOK_SECRET]: Joi.string().required(),
      [EnvField.FACEBOOK_APP_TOKEN]: Joi.string().required(),
      [EnvField.FIREBASE_FILE]: Joi.string().required(),
      [EnvField.FIREBASE_URL]: Joi.string().required(),
      [EnvField.FIREBASE_BUCKET]: Joi.string().required(),
    });

    const { error, value: validatedEnvConfig } = Joi.validate(
      envConfig,
      envVarsSchema,
    );

    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }

    return validatedEnvConfig;
  }
}
