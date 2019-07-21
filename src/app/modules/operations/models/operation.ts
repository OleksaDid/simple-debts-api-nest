import {prop, Ref, Typegoose} from 'typegoose';
import {Debt} from '../../debts/models/debt';
import {IsDate, IsNumber} from 'class-validator';
import {User} from '../../users/models/user';
import {OperationStatus} from './operation-status.enum';
import {BasicDocumentFields} from '../../../common/classes/basic-document-fields';
import {ObjectId} from '../../../common/classes/object-id';

export class Operation extends Typegoose implements BasicDocumentFields {
  _id: ObjectId;

  @prop({ref: Debt, required: true})
  debtsId: Ref<Debt>;

  @IsDate()
  @prop({default: Date.now(), required: true})
  date: Date;

  @IsNumber()
  @prop({required: true, min: 1})
  moneyAmount: number;

  @prop({ref: User, required: true})
  moneyReceiver: Ref<User>;

  @prop()
  description?: string;

  @prop({required: true, enum: OperationStatus})
  status: OperationStatus;

  @prop({ref: User, required: true})
  statusAcceptor: Ref<User>;

  @prop({ref: User})
  cancelledBy?: Ref<User>;
}
