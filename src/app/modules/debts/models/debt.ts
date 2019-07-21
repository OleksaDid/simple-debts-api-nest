import {arrayProp, instanceMethod, prop, Ref, Typegoose, InstanceType} from 'typegoose';
import {User} from '../../users/models/user';
import {DebtsAccountType} from './debts-account-type.enum';
import {DebtsStatus} from './debts-status.enum';
import {Operation} from '../../operations/models/operation';
import {OperationsCollectionRef} from '../../operations/models/operation-collection-ref';
import {OperationStatus} from '../../operations/models/operation-status.enum';
import {BasicDocumentFields} from '../../../common/classes/basic-document-fields';
import {ObjectId} from '../../../common/classes/object-id';
import {Logger} from '@nestjs/common';


export class Debt extends Typegoose implements BasicDocumentFields {
  _id: ObjectId;

  @arrayProp({itemsRef: User, required: true})
  users: Ref<User>[];

  @prop({required: true, enum: DebtsAccountType})
  type: DebtsAccountType;

  @prop({required: true, minlength: 3, maxlength: 3})
  currency: string;

  @prop({required: true, enum: DebtsStatus})
  status: DebtsStatus;

  @prop({required: true, ref: User})
  statusAcceptor: Ref<User>;

  @prop({required: true, min: 0})
  summary: number;

  @prop({required: true, ref: User})
  moneyReceiver: Ref<User>;

  @arrayProp({itemsRef: Operation, required: true})
  moneyOperations: Ref<Operation>[];


  @instanceMethod
  async calculateSummary(this: InstanceType<Debt>) {
    if(this.moneyOperations.length > 0) {
      const operations = await new Operation().getModelForClass(Operation, {schemaOptions: {collection: OperationsCollectionRef}})
        .find({
          _id: {$in: this.moneyOperations},
          status: OperationStatus.UNCHANGED
        })
        .exec() as InstanceType<Operation>[];

      const user1Summary = getUserOperationsSummary(operations, this.users[0]);
      const user2Summary = getUserOperationsSummary(operations, this.users[1]);

      this.summary = Math.abs(user1Summary - user2Summary);

      if(this.summary === 0) {
        this.moneyReceiver = null;
      } else {
        this.moneyReceiver = user1Summary > user2Summary ? this.users[0] : this.users[1];
      }
    } else {
      this.summary = 0;
      this.moneyReceiver = null;
    }

    return this.save();

    function getUserOperationsSummary(allOperations: InstanceType<Operation>[], userId: Ref<User>): number {
      return allOperations
        .filter(operation => operation.moneyReceiver.toString() === userId.toString())
        .reduce((summary, operation) => summary += operation.moneyAmount, 0);
    }
  }
}
