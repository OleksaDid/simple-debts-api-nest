import {Db, MongoClient, Collection} from 'mongodb';
import {DebtInterface} from '../../src/app/modules/debts/models/debt.interface';
import {UserInterface} from '../../src/app/modules/users/models/user.interface';
import {OperationInterface} from '../../src/app/modules/operations/models/operation.interface';

export class DbHelper {
  private _db: Db;
  private _Debts: Collection<DebtInterface>;
  private _Users: Collection<UserInterface>;
  private _Operations: Collection<OperationInterface>;

  private readonly _dbUrl: string;


  constructor(dbUrl: string) {
    this._dbUrl = dbUrl;
  }


  async init(): Promise<void>{
    this._db = await MongoClient.connect(this._dbUrl);

    this._Debts = this._db.collection('debts');
    this._Users = this._db.collection('users');
    this._Operations = this._db.collection('moneyOperations');
  }


  get db(): Db {
    return this._db;
  }

  get Debts(): Collection<DebtInterface> {
    return this._Debts;
  }

  get Users(): Collection<UserInterface> {
    return this._Users;
  }

  get Operations(): Collection<OperationInterface> {
    return this._Operations;
  }

}
