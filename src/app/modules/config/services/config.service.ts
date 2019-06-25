import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import * as fs from 'fs';
import {EnvConfig} from '../models/env-config.interface';
import {EnvType} from '../models/env-type.enum';
import {EnvField} from '../models/env-field.enum';
import {MongooseOptionsFactory, MongooseModuleOptions} from '@nestjs/mongoose';

export class ConfigService implements MongooseOptionsFactory {

  private readonly _envConfig: EnvConfig;

  constructor(filePath: string) {
    const config = dotenv.parse(fs.readFileSync(filePath));
    this._envConfig = this._validateInput(config);
  }



  get(field: EnvField): string {
    return this._envConfig[field];
  }

  createMongooseOptions(): Promise<MongooseModuleOptions> | MongooseModuleOptions {
    return {
      uri: this.get(EnvField.NODE_ENV) === EnvType.LOCAL ? this.get(EnvField.MONGODB_URI) : this.get(EnvField.MONGOLAB_URI),
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
      [EnvField.FACEBOOK_TEST_USER_TOKEN]: Joi.string().required()
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
