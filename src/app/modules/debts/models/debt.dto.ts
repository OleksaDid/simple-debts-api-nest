import {Id} from "../../../common/types/types";
import {OperationInterface} from "../../operations/operation.interface";
import {
    ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive,
    IsString,
    Length
} from 'class-validator';
import {DebtsAccountType} from './debts-account-type.enum';
import {DebtsStatus} from './debts-status.enum';
import {DebtResponseDto} from './debt-response.dto';

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
    @Length(2, 2)
    countryCode: string;

    @IsNotEmpty()
    @IsEnum(DebtsStatus)
    status: DebtsStatus;

    @IsOptional()
    @IsMongoId()
    statusAcceptor: Id;

    @IsNumber()
    @IsPositive()
    summary: number;

    @IsOptional()
    @IsMongoId()
    moneyReceiver: Id;


    @IsArray()
    @ArrayUnique()
    moneyOperations: OperationInterface[];

    constructor(creatorId: Id, secondUserId: Id, type: DebtsAccountType, countryCode: string) {
        this.users = [creatorId, secondUserId];
        this.type = type;
        this.countryCode = countryCode;
        this.status = type === DebtsAccountType.SINGLE_USER ? DebtsStatus.UNCHANGED : DebtsStatus.CREATION_AWAITING;
        this.statusAcceptor = type === DebtsAccountType.SINGLE_USER ? null : secondUserId;
        this.summary = 0;
        this.moneyReceiver = null;
        this.moneyOperations = [];
    }
}


export class DebtsListDto {
    @IsArray()
    debts: DebtResponseDto[];

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



class DebtsListSummary  {
    @IsNumber()
    @IsPositive()
    toGive: number;

    @IsNumber()
    @IsPositive()
    toTake: number;

    constructor(toGive: number, toTake: number) {
        this.toGive = toGive;
        this.toTake = toTake;
    }
}