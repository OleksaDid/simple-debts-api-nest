import * as request from 'supertest';
import {AuthUser} from '../src/app/modules/authentication/models/auth-user';
import {AuthenticationHelper} from './helpers/authentication.helper';
import {AppHelper} from './helpers/app.helper';
import {Collection} from 'mongodb';
import {DebtInterface} from '../src/app/modules/debts/models/debt.interface';
import {OperationInterface} from '../src/app/modules/operations/models/operation.interface';
import {DbHelper} from './helpers/db.helper';
import {EnvField} from '../src/app/modules/config/models/env-field.enum';
import {DebtsStatus} from '../src/app/modules/debts/models/debts-status.enum';
import {DebtResponseDto} from '../src/app/modules/debts/models/debt-response.dto';
import {CreateOperationDto} from '../src/app/modules/operations/models/create-operation.dto';
import {OperationResponseDto} from '../src/app/modules/operations/models/operation-response.dto';
import {INestApplication, Logger} from '@nestjs/common';
import {validate} from 'class-validator';
import {plainToClass} from 'class-transformer';
import {OperationStatus} from '../src/app/modules/operations/models/operation-status.enum';
import * as mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

const credentials = require('./fixtures/debts-users');

import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../config/test.env' });


describe('Operations (e2e)', () => {
  let app: INestApplication;
  let authHelper: AuthenticationHelper;
  let user: AuthUser;
  let user2: AuthUser;

  let Debts: Collection<DebtInterface>;
  let Operations: Collection<OperationInterface>;

  let debt: DebtResponseDto;
  let singleDebt: DebtResponseDto;

  let operationPayload: CreateOperationDto;
  let operationPayloadSingle: CreateOperationDto;

  let operation: OperationInterface;
  let operationSingle: OperationInterface;
  let moneyOperations: OperationInterface[] = [];

  beforeAll(async () => {
    app = await AppHelper.getTestApp();

    authHelper = new AuthenticationHelper(app);

    await Promise.all([
      authHelper.authenticateUser(credentials.user1),
      authHelper.authenticateUser(credentials.user2),
    ]).then(([_user1, _user2]) => {
      user = _user1;
      user2 = _user2;
    });

    const dbHelper = new DbHelper(process.env[EnvField.MONGODB_URI]);
    await dbHelper.init();
    Debts = dbHelper.Debts;
    Operations = dbHelper.Operations;

    Debts.drop();
    Operations.drop();

    debt = (await request(app.getHttpServer())
      .post('/debts/multiple')
      .send({userId: user2.user.id, currency: 'UA'})
      .set('Authorization', `Bearer ${user.token}`))
      .body;

    await request(app.getHttpServer())
      .post(`/debts/multiple/${debt.id}/creation/accept`)
      .set('Authorization', `Bearer ${user2.token}`);

    debt.status = DebtsStatus.UNCHANGED;
    debt.statusAcceptor = null;

    operationPayload = {
      debtsId: debt.id,
      moneyAmount: 300,
      moneyReceiver: user2.user.id,
      description: 'test'
    };

    singleDebt = (await request(app.getHttpServer())
      .post('/debts/single')
      .send({userName: 'Valera12', currency: 'UA'})
      .set('Authorization', `Bearer ${user.token}`))
      .body;

    operationPayloadSingle = {
      debtsId: singleDebt.id,
      moneyAmount: 300,
      moneyReceiver: singleDebt.user.id,
      description: 'test'
    };
  });

  afterAll(() => {
    Debts.drop();
    Operations.drop();
  });

  describe('POST /operations', () => {

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post('/operations').send(operationPayload)
      );
    });

    it('should throw an error if you try to create operation w/ invalid debtsId', () => {
      const promises = [];
      const debtIds = ['bkhjvgcfydte565r7t8', '', 'A', null, undefined, 235, true, false, [], ['lnjbjgyiuh'], {}];

      debtIds.forEach(id => {
        promises.push(
          request(app.getHttpServer())
            .post('/operations')
            .send(Object.assign({}, operationPayload, {debtsId: id}))
            .set('Authorization', `Bearer ${user.token}`)
        );
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(({statusCode}) => {
            expect(statusCode).toBe(400);
          });
        });
    });

    it('should throw an error if you try to create operation w/ invalid moneyReceiver', () => {
      const promises = [];
      const userIds = ['bkhjvgcfydte565r7t8', '', 'A', null, undefined, 235, true, false, [], ['erhkvb'], {}];

      userIds.forEach(id => {
        promises.push(
          request(app.getHttpServer())
            .post('/operations')
            .send(Object.assign({}, operationPayload, {moneyReceiver: id}))
            .set('Authorization', `Bearer ${user.token}`)
        );
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(({statusCode}) => {
            expect(statusCode).toBe(400);
          });
        });
    });

    it('should throw an error if you try to create operation w/ invalid moneyAmount', () => {
      const promises = [];
      const moneyVariants = ['bkhjvgcfydte565r7t8', '', 'A', null, undefined, true, false, 0, -20, [], [20], {}];

      moneyVariants.forEach(sum => {
        promises.push(
          request(app.getHttpServer())
            .post('/operations')
            .send(Object.assign({}, operationPayload, {moneyAmount: sum}))
            .set('Authorization', `Bearer ${user.token}`)
        );
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(({statusCode}) => {
            expect(statusCode).toBe(400);
          });
        });
    });

    it('should throw an error if you try to create operation w/ invalid description', () => {
      const promises = [];
      const descriptions = [
        'rjglnrluhriluvhgeriugveiryvgrekgvkregvkergvjlkhgfdsdrtyuijkhgfdet4567iuhjgfde45678iuhjgfde45678yiuhjgvfcdxserytu6yhjkbvcdxfrtyuihkjbvcdfrtyuijhgvfgftyghftyugjhfctyhgvhfhtybvghfjvcfghjvbfcgh'];

      descriptions.forEach(desc => {
        promises.push(
          request(app.getHttpServer())
            .post('/operations')
            .send(Object.assign({}, operationPayload, {description: desc}))
            .set('Authorization', `Bearer ${user.token}`)
        );
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(({statusCode}) => {
            expect(statusCode).toBe(400);
          });
        });
    });

    it('creates new operation in db', async () => {
      const {body: op} = await request(app.getHttpServer())
        .post('/operations')
        .send(Object.assign({}, operationPayload))
        .set('Authorization', `Bearer ${user.token}`)
        .expect(201);

      const operations = await Operations.find().toArray();

      expect(operations).toBeTruthy();
      expect(Array.isArray(operations)).toBeTruthy();
      expect(operations.length).toBe(1);
      moneyOperations.push(operations[0]);
      operation = operations[0];
      operation.id = operation._id.toString();
    });

    it('creates new operation in moneyOperations array of debts object', async () => {
      const {body: _debt} = await request(app.getHttpServer())
        .get(`/debts/${debt.id}`)
        .set('Authorization', `Bearer ${user.token}`);

      expect(_debt).toHaveProperty('moneyOperations');
      expect(Array.isArray(_debt.moneyOperations)).toBeTruthy();
      expect(_debt.moneyOperations.length).toBe(1);

      const moneyOperation = _debt.moneyOperations[0];
      const errors = await validate(plainToClass(OperationResponseDto, moneyOperation));
      expect(errors).toHaveLength(0);

      // date moneyAmount moneyReceiver description status statusAcceptor
      expect(moneyOperation).toHaveProperty('id', operation.id);
      expect(moneyOperation).toHaveProperty('date');
      expect(new Date(moneyOperation.date).getTime()).toBe(new Date(operation.date).getTime());
      expect(moneyOperation).toHaveProperty('moneyReceiver', operationPayload.moneyReceiver);
      expect(moneyOperation).toHaveProperty('moneyAmount', operationPayload.moneyAmount);
      expect(moneyOperation).toHaveProperty('description', operationPayload.description);
      expect(moneyOperation).toHaveProperty('status', 'CREATION_AWAITING');
      expect(moneyOperation).toHaveProperty('statusAcceptor', user2.user.id);

    });

    it('changes debts status to \'CHANGE_AWAITING\' for multiple users', () => {
      return request(app.getHttpServer())
        .get(`/debts/${debt.id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .then(({body: _debt}) => {
          expect(_debt).toHaveProperty('status', DebtsStatus.CHANGE_AWAITING);
        });
    });

    it('doesn\'t change debts debt summary for multiple users', () => {
      return request(app.getHttpServer())
        .get(`/debts/${debt.id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .then(({body: _debt}) => {
          expect(_debt).toHaveProperty('summary', 0);
          expect(_debt).toHaveProperty('moneyReceiver', null);
        });
    });

    it('sets statusAcceptor to another user in multiple users', () => {
      return request(app.getHttpServer())
        .get(`/debts/${debt.id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .then(({body: _debt}) => {
          expect(_debt).toHaveProperty('statusAcceptor', user2.user.id);
        });
    });

    it('returns debt object', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .send(Object.assign({}, operationPayload))
        .set('Authorization', `Bearer ${user.token}`)
        .then(({body: _debt}) => {
          Object.keys(debt).forEach(key => {
            expect(_debt).toHaveProperty(key);
          });

          debt = _debt;
        });
    });

    it('doesn\'t change status for single user debt', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .send(Object.assign({}, operationPayloadSingle))
        .set('Authorization', `Bearer ${user.token}`)
        .then(({body: _debt}) => {
          Object.keys(singleDebt).forEach(key => {
            expect(_debt).toHaveProperty(key);
          });

          expect(_debt).toHaveProperty('status', DebtsStatus.UNCHANGED);
        });
    });

    it('add summary in single debts', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .send(Object.assign({}, operationPayloadSingle))
        .set('Authorization', `Bearer ${user.token}`)
        .then(({body: _debt}) => {
          expect(_debt).toHaveProperty('summary', operationPayload.moneyAmount * 2);
          expect(_debt).toHaveProperty('moneyReceiver', operationPayloadSingle.moneyReceiver);
        });
    });

    it('deduct summary in single debts', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .send(Object.assign({}, operationPayloadSingle, {moneyReceiver: user.user.id}))
        .set('Authorization', `Bearer ${user.token}`)
        .then(({body: _debt}) => {
          expect(_debt).toHaveProperty('summary', operationPayload.moneyAmount);
          expect(_debt).toHaveProperty('moneyReceiver', operationPayloadSingle.moneyReceiver);
        });
    });

    it('sets money receiver to null if summary is 0', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .send(Object.assign({}, operationPayloadSingle, {moneyReceiver: user.user.id}))
        .set('Authorization', `Bearer ${user.token}`)
        .then(({body: _debt}) => {
          expect(_debt).toHaveProperty('summary', 0);
          expect(_debt).toHaveProperty('moneyReceiver', null);
        });
    });

    it('changes money receiver depending on summary', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .send(Object.assign({}, operationPayloadSingle, {moneyReceiver: user.user.id}))
        .set('Authorization', `Bearer ${user.token}`)
        .then(({body: _debt}) => {
          expect(_debt).toHaveProperty('summary', operationPayloadSingle.moneyAmount);
          expect(_debt).toHaveProperty('moneyReceiver', user.user.id);
        });
    });

    it('doesn\'t change statusAcceptor in single debts', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .send(Object.assign({}, operationPayloadSingle, {moneyReceiver: user.user.id}))
        .set('Authorization', `Bearer ${user.token}`)
        .then(({body: _debt}) => {
          expect(_debt).toHaveProperty('statusAcceptor', null);

          operationSingle = _debt.moneyOperations[0];
          singleDebt = _debt;
        });
    });
  });




  describe('POST /operations/:id/creation/accept', () => {
    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post(`/operations/${operation.id}/creation/accept`)
      );
    });

    it('should return 400 or 404 if no param is set', () => {
      const promises = [];
      const params = [
        '',
        '/',
        ' ',
        null,
        undefined
      ];

      params.forEach(param => {
        promises.push(request(app.getHttpServer()).post(`/operations/${param}/creation/accept`).set('Authorization', `Bearer ${user2.token}`));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(({statusCode}) => {
          expect(statusCode).toBeGreaterThanOrEqual(400);
          expect(statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .post('/operations/knjkbhgvfyrdte45r/creation/accept')
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(400)
        .then(({body}) => {
          expect(body).toHaveProperty('error');
        });
    });

    it('should return 400 if you try to accept operation from single debts', () => {

      return request(app.getHttpServer())
        .post(`/operations/${operationSingle.id}/creation/accept`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(400)
        .then(({body}) => {
          expect(body).toHaveProperty('error');
        });
    });

    it('should return 400 if no statusAcceptor tries to accept operation', () => {

      return request(app.getHttpServer())
        .post(`/operations/${operation.id}/creation/accept`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(400)
        .then(({body}) => {
          expect(body).toHaveProperty('error');
        });
    });

    it('should return debts by id and calculate summary', () => {

      return request(app.getHttpServer())
        .post(`/operations/${operation.id}/creation/accept`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(201)
        .then(({body: _debt}) => {
          expect(_debt).toHaveProperty('summary', operationPayload.moneyAmount);
          expect(_debt).toHaveProperty('moneyReceiver', operationPayload.moneyReceiver);
          expect(_debt).toHaveProperty('status', 'CHANGE_AWAITING');

          debt = _debt;
        });
    });

    it('should change debt\'s status to \'UNCHANGED\' if all operations are accepted', () => {
      const promises = [];

      debt.moneyOperations.forEach(op => {
        if(op.status === OperationStatus.CREATION_AWAITING) {
          promises.push(
            request(app.getHttpServer())
              .post(`/operations/${op.id}/creation/accept`)
              .set('Authorization', `Bearer ${user2.token}`)
              .expect(201)
          );
        }
      });

      return Promise.all(promises)
        .then(() => {
          return Debts.findOne({_id: new ObjectId(debt.id)}).then(debt => {
            expect(debt.status).toBe(DebtsStatus.UNCHANGED);
          });
        });
    });

    it('should return an error if you try to accept the same operation few times', () => {
      return request(app.getHttpServer())
        .post(`/operations/${operation.id}/creation/accept`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(400)
        .then(({body}) => {
          expect(body).toHaveProperty('error');
        });
    });

    it('should change operation\'s status to \'UNCHANGED\'', () => {
      return Operations.findOne({_id: new ObjectId(operation.id)}).then(operation => {
        expect(operation.status).toBe(OperationStatus.UNCHANGED);
        expect(operation.statusAcceptor).toBeNull();
      });
    });

  });




  describe('POST /operations/:id/creation/decline', () => {
    let newOperation;

    beforeAll(() => {
      return request(app.getHttpServer())
        .post('/operations')
        .send(Object.assign({}, operationPayload))
        .set('Authorization', `Bearer ${user.token}`)
        .expect(201)
        .then(({body}) => newOperation = body.moneyOperations[0]);
    });


    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post(`/operations/${newOperation.id}/creation/decline`)
      );
    });

    it('should return 400 or 404 if no param is set', () => {
      const promises = [];
      const params = [
        '',
        '/',
        ' ',
        null,
        undefined
      ];

      params.forEach(param => {
        promises.push(request(app.getHttpServer()).post(`/operations/${param}/creation/decline`).set('Authorization', `Bearer ${user2.token}`));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(({statusCode}) => {
          expect(statusCode).toBeGreaterThanOrEqual(400);
          expect(statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .post('/operations/' + 'knjkbhgvfyrdte45r' + '/creation/decline')
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(400)
        .then(({body}) => expect(body).toHaveProperty('error'));
    });

    it('should return 400 if you try to delete operation from single debts', () => {

      return request(app.getHttpServer())
        .post(`/operations/${operationSingle.id}/creation/decline`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(400)
        .then(({body}) => expect(body).toHaveProperty('error'));
    });

    it('should return 400 if you try to delete accepted operation', () => {

      return request(app.getHttpServer())
        .post(`/operations/${operation.id}/creation/decline`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(400)
        .then(({body}) => expect(body).toHaveProperty('error'));
    });

    it('should return debts by id, set status to \'UNCHANGED\' and set operations status to CANCELLED', () => {

      return request(app.getHttpServer())
        .post(`/operations/${newOperation.id}/creation/decline`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(201)
        .then(async ({body: _debt}) => {
          expect(_debt).toHaveProperty('status', DebtsStatus.UNCHANGED);
          expect(_debt).toHaveProperty('statusAcceptor', null);

          expect(_debt.moneyOperations.find(operation => operation.id === newOperation.id)).toBeTruthy();

          const operation = await Operations.findOne({_id: new ObjectId(newOperation.id)});
          expect(operation.status).toBe(OperationStatus.CANCELLED);
        });
    });

    it('should return an error if you try to delete the same operation few times', () => {
      return request(app.getHttpServer())
        .post(`/operations/${newOperation.id}/creation/decline`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(400)
        .then(({body}) => expect(body).toHaveProperty('error'));
    });

    it('can be cancelled by user who\'s created operation', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .send(Object.assign({}, operationPayload))
        .set('Authorization', `Bearer ${user.token}`)
        .expect(201)
        .then(({body: _debt}) => newOperation = _debt.moneyOperations[0])
        .then(() => request(app.getHttpServer())
          .post(`/operations/${newOperation.id}/creation/decline`)
          .set('Authorization', `Bearer ${user.token}`)
          .expect(201))
        .then(({body: _debt}) => {
          expect(_debt).toHaveProperty('status', DebtsStatus.UNCHANGED);
          expect(_debt).toHaveProperty('statusAcceptor', null);

          expect(_debt.moneyOperations.find(operation => operation.id === newOperation.id)).toBeTruthy();

          return Operations.findOne({_id: new ObjectId(newOperation.id)});
        })
        .then(operation => expect(operation.status).toBe(OperationStatus.CANCELLED));
    });
  });



  describe('DELETE /operations/:id', () => {
    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).delete(`/operations/${singleDebt.id}`)
      );
    });

    it('should return 400 or 404 if no param is set', () => {
      const promises = [];
      const params = [
        '',
        '/',
        ' ',
        null,
        undefined
      ];

      params.forEach(param => {
        promises.push(request(app.getHttpServer()).delete(`/operations/${param}`).set('Authorization', `Bearer ${user.token}`));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(({statusCode}) => {
          expect(statusCode).toBeGreaterThanOrEqual(400);
          expect(statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .delete('/operations/' + 'pj2i4hui3gyfu')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(400)
        .then(({body}) => {
          expect(body).toHaveProperty('error');
        });
    });

    it('should return 400 if you try to delete operation from multiple debts', () => {

      return request(app.getHttpServer())
        .delete(`/operations/${operation.id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(400)
        .then(({body}) => {
          expect(body).toHaveProperty('error');
        });
    });

    it('should return debts by id & recalculate summary & remove id from moneyOperations list', () => {
      return request(app.getHttpServer())
        .delete(`/operations/${operationSingle.id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200)
        .then(({body: _debt}) => {
          Object.keys(singleDebt).forEach(key => {
            expect(_debt).toHaveProperty(key);
          });

          expect(singleDebt.summary).not.toBe(_debt.summary);

          expect(_debt.moneyOperations.find(operation => operation.id === operationSingle.id)).not.toBeTruthy();
        });
    });

    it('should remove operation from db', () => {
      return Operations
        .findOne({_id: new ObjectId(operationSingle.id)})
        .then(resp => {
          expect(resp).toBe(null);
        });
    });
  });
});
