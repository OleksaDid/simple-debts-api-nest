import {Id} from "../../common/types/types";
import {DebtsAccountType, DebtsStatus} from "./debt.interface";
import {OperationInterface} from "../operations/operation.interface";
import {ValidationObject} from "../../common/classes/validation-object";

export class DebtDto {
    users: Id[];
    type: DebtsAccountType;
    countryCode: string;
    status: DebtsStatus;
    statusAcceptor: Id;
    summary: number;
    moneyReceiver: Id;
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
    debts: DebtDto[];
    summary: DebtsListSummary;

    constructor(debts: DebtDto[], userId: Id) {
        this.debts = debts;
        this.summary = new DebtsListSummary(0, 0);
        this.calculateSummary(userId);
    }
    
    private calculateSummary(userId: Id) {
        this.summary = this.debts.reduce((summary: DebtsListSummary, debt: DebtDto) => {
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
    toGive: number;
    toTake: number;

    constructor(toGive: number, toTake: number) {
        this.toGive = toGive;
        this.toTake = toTake;
    }
}

export class DebtsIdValidationObject extends ValidationObject {
    debtsId: Id;

    constructor(errors: any, userId: Id, debtsId: Id) {
        super(errors, userId);
        this.debtsId = debtsId;
    }
}