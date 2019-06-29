import {Id} from "../../../common/types/types";
import {OperationInterface} from "../../operations/models/operation.interface";
import {
  ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive,
  IsString,
  Length
} from 'class-validator';
import {DebtsAccountType} from './debts-account-type.enum';
import {DebtsStatus} from './debts-status.enum';
import {DebtResponseDto} from './debt-response.dto';
import {ApiModelProperty} from '@nestjs/swagger';

export class DebtDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(2)
  @ArrayMinSize(2)
  users: Id[];

  @IsNotEmpty()
  @IsEnum(DebtsAccountType)
  type: DebtsAccountType;

  @IsNotEmpty()
  @IsString()
  @Length(3, 3)
  currency: string;

  @IsNotEmpty()
  @IsEnum(DebtsStatus)
  status: DebtsStatus;

  @IsOptional()
  @IsMongoId()
  statusAcceptor: Id;

  @IsNumber()
  summary: number;

  @IsOptional()
  @IsMongoId()
  moneyReceiver: Id;


  @IsArray()
  @ArrayUnique()
  moneyOperations: OperationInterface[];

  constructor(creatorId: Id, secondUserId: Id, type: DebtsAccountType, currency: string) {
    this.users = [creatorId, secondUserId];
    this.type = type;
    this.currency = currency;
    this.status = type === DebtsAccountType.SINGLE_USER ? DebtsStatus.UNCHANGED : DebtsStatus.CREATION_AWAITING;
    this.statusAcceptor = type === DebtsAccountType.SINGLE_USER ? null : secondUserId;
    this.summary = 0;
    this.moneyReceiver = null;
    this.moneyOperations = [];
  }
}



class DebtsListSummary  {
  @ApiModelProperty({
    description: 'amount of money you should give back',
    type: 'number'
  })
  @IsNumber()
  @IsPositive()
  toGive: number;

  @ApiModelProperty({
    description: 'amount of money you should collect',
    type: 'number'
  })
  @IsNumber()
  @IsPositive()
  toTake: number;

  constructor(toGive: number, toTake: number) {
    this.toGive = toGive;
    this.toTake = toTake;
  }
}

export class DebtsListDto {
  @ApiModelProperty({
    description: 'list of all debts',
    type: DebtResponseDto,
    isArray: true
  })
  @IsArray()
  debts: DebtResponseDto[];


  @ApiModelProperty({
    description: 'summary object',
    type: DebtsListSummary
  })
  summary: DebtsListSummary;

  constructor(debts: DebtResponseDto[], userId: Id) {
    this.debts = debts;
    this.summary = new DebtsListSummary(0, 0);
    this.calculateSummary(userId);
  }

  private calculateSummary(userId: Id) {
    this.summary = this.debts.reduce((summary: DebtsListSummary, debt: DebtResponseDto) => {
      if(debt.moneyReceiver === null) {
        return summary;
      }

      if(debt.moneyReceiver.toString() === userId.toString()) {
        return new DebtsListSummary(summary.toGive, summary.toTake + debt.summary);
      }

      if(debt.moneyReceiver.toString() !== userId.toString()) {
        return new DebtsListSummary(summary.toGive + debt.summary, summary.toTake);
      }
    }, this.summary);
  }
}
