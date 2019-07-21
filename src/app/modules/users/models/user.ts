import {arrayProp, instanceMethod, prop, Typegoose} from 'typegoose';
import * as bcrypt from 'bcrypt-nodejs';
import {IsBoolean, IsEmail, IsString, Validator} from 'class-validator';
import {BasicDocumentFields} from '../../../common/classes/basic-document-fields';
import {ObjectId} from '../../../common/classes/object-id';

const validator = new Validator();


export class User extends Typegoose implements BasicDocumentFields {
  _id: ObjectId;

  @IsEmail()
  @prop({index: true, unique: true, sparse: true, lowercase: true, validate: value => validator.isEmail(value)})
  email?: string;

  @IsString()
  @prop({required: true, minlength: 1, maxlength: 30})
  name: string;

  @IsString()
  @prop({required: true})
  picture: string;

  @IsString()
  @prop()
  password?: string;

  @IsBoolean()
  @prop({default: false})
  virtual: boolean;

  @prop({index: true, unique: true, sparse: true})
  facebook?: string;

  @prop()
  refreshTokenId: string;

  @prop()
  accessTokenId: string;

  @arrayProp({ items: String })
  pushTokens: string[];


  @instanceMethod
  generatePasswordHash(password: string): void {
    this.password = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
  }

  @instanceMethod
  validatePassword(password: string): boolean {
    return this.password
      ? bcrypt.compareSync(password, this.password)
      : false;
  }
}
