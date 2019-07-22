import {Db, MongoClient, Collection} from 'mongodb';
import {Debt} from '../../src/app/modules/debts/models/debt';
import {Operation} from '../../src/app/modules/operations/models/operation';
import {User} from '../../src/app/modules/users/models/user';
import {DebtsCollectionRef} from '../../src/app/modules/debts/models/debts-collection-ref';
import {UserCollectionRef} from '../../src/app/modules/users/models/user-collection-ref';
import {OperationsCollectionRef} from '../../src/app/modules/operations/models/operation-collection-ref';

export class DbHelper {
  private _db: Db;
  private _Debts: Collection<Debt>;
  private _Users: Collection<User>;
  private _Operations: Collection<Operation>;

  private readonly _dbUrl: string;


  constructor(dbUrl: string) {
    this._dbUrl = dbUrl;
  }


  async init(): Promise<void>{
    this._db = await MongoClient.connect(this._dbUrl);

    this._Debts = this._db.collection(DebtsCollectionRef);
    this._Users = this._db.collection(UserCollectionRef);
    this._Operations = this._db.collection(OperationsCollectionRef);
  }


  get db(): Db {
    return this._db;
  }

  get Debts(): Collection<Debt> {
    return this._Debts;
  }

  get Users(): Collection<User> {
    return this._Users;
  }

  get Operations(): Collection<Operation> {
    return this._Operations;
  }

}
