import * as fs from "fs";
import 'reflect-metadata';
import * as request from 'supertest';
import {DebtDto} from '../src/app/modules/debts/models/debt.dto';
import {DebtsStatus} from '../src/app/modules/debts/models/debts-status.enum';
import {DebtsAccountType} from '../src/app/modules/debts/models/debts-account-type.enum';
import * as mongoose from 'mongoose';
import {UserInterface} from '../src/app/modules/users/models/user.interface';
import {Logger} from '@nestjs/common';
import {Collection} from 'mongodb';
import {AuthUser} from '../src/app/modules/authentication/models/auth-user';
import {AuthenticationHelper} from './helpers/authentication.helper';
import {DbHelper} from './helpers/db.helper';
import {DebtInterface} from '../src/app/modules/debts/models/debt.interface';
import {AppHelper} from './helpers/app.helper';
import {OperationInterface} from '../src/app/modules/operations/models/operation.interface';
import {EnvField} from '../src/app/modules/config/models/env-field.enum';

const users = require('./fixtures/debts-users');
const ObjectId = mongoose.Types.ObjectId;


import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../config/test.env' });


describe('Debts (e2e)', () => {
  let app;
  let authHelper: AuthenticationHelper;

  let User: Collection<UserInterface>;
  let Debts: Collection<DebtInterface>;
  let Operations: Collection<OperationInterface>;

  let user1: AuthUser;
  let user2: AuthUser;
  let user3: AuthUser;

  let singleDebt;
  let multipleDebt;
  let connectUserDebt;

  let connectUserDebtVirtualUser;

  beforeAll(async () => {
    const dbHelper = new DbHelper(process.env[EnvField.MONGODB_URI]);
    await dbHelper.init();
    Debts = dbHelper.Debts;
    User = dbHelper.Users;
    Operations = dbHelper.Operations;

    app = await AppHelper.getTestApp();


    authHelper = new AuthenticationHelper(app);

    await Promise.all([
      authHelper.authenticateUser(users.user1),
      authHelper.authenticateUser(users.user2),
      authHelper.authenticateUser(users.user3),
    ])
      .then(([_user1, _user2, _user3]) => {
        user1 = _user1;
        user2 = _user2;
        user3 = _user3;
      })
      .catch(err => Logger.error(err));
  }, 10000);

  afterAll(async () => {
    await Debts.drop();
    await Operations.drop();
  });
  
  

  describe('POST /debts/multiple', () => {

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post('/debts/multiple').send({userId: user2.user.id, countryCode: 'UA'})
      );
    });

    it('should throw an error if you try to create debts w/ yourself', () => {
      return request(app.getHttpServer())
        .post('/debts/multiple')
        .send({userId: user1.user.id, countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error', 'You cannot create Debts with yourself');
        });
    });

    it('should throw an error if you try to create debts w/ invalid user', () => {
      const promises = [];
      const users = ['', 'kjlhgf6789'];

      users.forEach(user => {
        promises.push(
          request(app.getHttpServer())
            .post('/debts/multiple')
            .send({userId: user, countryCode: 'UA'})
            .set('Authorization', 'Bearer ' + user1.token)
        );
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(resp => {
            expect(resp.statusCode).toBe(400);
          });
        });
    });

    it('should throw an error if you try to create debts w/ invalid country code', () => {
      const promises = [];
      const codes = ['UAH', '', 'A'];

      codes.forEach(code => {
        promises.push(
          request(app.getHttpServer())
            .post('/debts/multiple')
            .send({userId: user2.user.id, countryCode: code})
            .set('Authorization', 'Bearer ' + user1.token)
        );
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(resp => {
            expect(resp.statusCode).toBe(400);
          });
        });
    });

    it('should return new created Debts object', () => {
      return request(app.getHttpServer())
        .post('/debts/multiple')
        .send({userId: user2.user.id, countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(201)
        .then(debt => {
          const expectedDebts: any = new DebtDto(
            user1.user.id,
            user2.user.id,
            DebtsAccountType.MULTIPLE_USERS,
            'UA'
          );

          expectedDebts.user = user2.user;
          delete expectedDebts.users;

          multipleDebt = debt.body;

          checkIsObjectMatchesDebtsModel(debt.body, expectedDebts);
        });
    });

    it('should throw an error if debts between these users already exists', () => {
      return request(app.getHttpServer())
        .post('/debts/multiple')
        .send({userId: user2.user.id, countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error', 'Such debts object is already created');
        });
    });
  });



  describe('POST /debts/single', () => {

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post('/debts/single').send({userName: 'Valera', countryCode: 'UA'})
      );
    });

    it('should throw an error if you try to create debts w/ invalid country code', () => {
      const promises = [];
      const codes = ['UAH', '', 'A'];

      codes.forEach(code => {
        promises.push(
          request(app.getHttpServer())
            .post('/debts/single')
            .send({userName: 'Valera', countryCode: code})
            .set('Authorization', 'Bearer ' + user1.token)
        );
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(resp => {
            expect(resp.statusCode).toBe(400);
          });
        });
    });

    it('should throw an error if you try to create debts w/ invalid username', () => {
      return request(app.getHttpServer())
        .post('/debts/single')
        .send({userName: '', countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should create new user & return new created Debts object', async () => {
      const debt = await request(app.getHttpServer())
        .post('/debts/single')
        .send({userName: 'Valera', countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(201);

      const expectedDebts: any = new DebtDto(
        user1.user.id,
        user2.user.id,
        DebtsAccountType.SINGLE_USER,
        'UA'
      );

      expectedDebts.user = {
        name: 'Valera'
      };
      delete expectedDebts.users;

      singleDebt = JSON.parse(JSON.stringify(debt.body));

      expect(debt.body.user).toHaveProperty('id');
      expect(debt.body.user).toHaveProperty('picture');

      delete debt.body.user.id;
      delete debt.body.user.picture;

      checkIsObjectMatchesDebtsModel(debt.body, expectedDebts);

      const virtualUser: UserInterface = await User.findOne({_id: new ObjectId(singleDebt.user.id)});

      expect(virtualUser).toHaveProperty('virtual');
      expect(virtualUser.virtual).toBeTruthy();
    });

    it('should throw an error if there is already virtual user w/ such name', () => {
      return request(app.getHttpServer())
        .post('/debts/single')
        .send({userName: 'Valera', countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error', 'You already have virtual user with such name');
        });
    });
  });


  describe('GET /debts', () => {

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).get('/debts')
      );
    });


    it('should return all created Debts and summary', () => {
      return request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(200)
        .then(resp => {
          const debts = resp.body;
          const debtsModel: any = new DebtDto(
            user1.user.id,
            user2.user.id,
            DebtsAccountType.MULTIPLE_USERS,
            'UA'
          );

          debtsModel.user = {
            id: '435tyeh',
            name: 'Valera',
            picture: 'vjhgtyt78'
          };
          delete debtsModel.users;
          delete debtsModel.moneyOperations;

          expect(debts).toHaveProperty('debts');
          expect(Array.isArray(debts.debts)).toBeTruthy();

          debts.debts.forEach(debt => {
            checkIsObjectMatchesDebtsModel(debt, debtsModel, false);
          });

          expect(debts).toHaveProperty('summary');
          expect(debts.summary).toHaveProperty('toGive', 0);
          expect(debts.summary).toHaveProperty('toTake', 0);
        });
    });
  });


  describe('GET /debts/:id', () => {

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).get('/debts/' + multipleDebt.id)
      );
    });

    it('should return 400 or 404 if no param is set', () => {
      const promises = [];
      const params = [
        '/',
        null,
        undefined
      ];

      params.forEach(param => {
        promises.push(request(app.getHttpServer()).get('/debts/' + param).set('Authorization', 'Bearer ' + user1.token));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBeGreaterThanOrEqual(400);
          expect(resp.statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .get('/debts/' + 'pj2i4hui3gyfu')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should return debt by id', () => {
      return request(app.getHttpServer())
        .get('/debts/' + multipleDebt.id)
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(200)
        .then(resp => {
          checkIsObjectMatchesDebtsModel(resp.body, multipleDebt);
        });
    });
  });


  describe('DELETE /debts/:id (single)', () => {

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).delete(`/debts/${singleDebt.id}`)
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
        promises.push(request(app.getHttpServer()).delete('/debts/' + param).set('Authorization', 'Bearer ' + user1.token));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBeGreaterThanOrEqual(400);
          expect(resp.statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .delete('/debts/' + 'pj2i4hui3gyfu')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should return all debts', () => {

      return request(app.getHttpServer())
        .delete('/debts/' + singleDebt.id)
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(200)
        .then(resp => {
          const debts = resp.body;
          const debtsModel: any = new DebtDto(
            user1.user.id,
            user2.user.id,
            DebtsAccountType.MULTIPLE_USERS,
            'UA'
          );

          debtsModel.user = {
            id: '435tyeh',
            name: 'Valera',
            picture: 'vjhgtyt78'
          };
          delete debtsModel.users;
          delete debtsModel.moneyOperations;

          expect(debts).toHaveProperty('debts');
          expect(Array.isArray(debts.debts)).toBeTruthy();

          debts.debts.forEach(debt => {
            checkIsObjectMatchesDebtsModel(debt, debtsModel, false);
          });

          expect(debts).toHaveProperty('summary');
          expect(debts.summary).toHaveProperty('toGive', 0);
          expect(debts.summary).toHaveProperty('toTake', 0);
        });
    });

    it('should remove debt from db', () => {
      return Debts
        .findOne({_id: new ObjectId(singleDebt.id)})
        .then(resp => {
          expect(resp).toBe(null);
        });
    });

    it('should remove virtual user from db', () => {
      return User
        .findOne({_id: new ObjectId(singleDebt.user.id)})
        .then(resp => {
          expect(resp).toBe(null);
        });
    });

    it('should remove virtual user\'s image from server', (done) => {
      fs.exists('public/images/' + singleDebt.user.picture.match(/[^\/]*$/), (exists) => {
        expect(exists).toBe(false);
        done();
      });
    });
  });


  describe('POST /debts/multiple/:id/creation/accept', () => {

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post(`/debts/multiple/${multipleDebt.id}/creation/accept`)
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
        promises.push(request(app.getHttpServer())
          .post('/debts/multiple/' + param + '/creation/accept')
          .set('Authorization', 'Bearer ' + user1.token));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBeGreaterThanOrEqual(400);
          expect(resp.statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .post('/debts/multiple/' + 'y34ygv4h3' + '/creation/accept')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should return an error if not statusAcceptor tries to accept debts', () => {

      return request(app.getHttpServer())
        .post('/debts/multiple/' + multipleDebt.id + '/creation/accept')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should return accepted debt & change status of debtId from \'CREATION_AWAITING\' to \'UNCHANGED\' & change statusAcceptor to null', () => {
      expect(multipleDebt.status).toBe('CREATION_AWAITING');

      return request(app.getHttpServer())
        .post('/debts/multiple/' + multipleDebt.id + '/creation/accept')
        .set('Authorization', 'Bearer ' + user2.token)
        .expect(201)
        .then(resp => {
          const debt = resp.body;
          const unchangedDebt = JSON.parse(JSON.stringify(multipleDebt));
          unchangedDebt.status = 'UNCHANGED';
          unchangedDebt.statusAcceptor = null;
          unchangedDebt.user = user1.user;
          delete unchangedDebt.moneyOperations;
          checkIsObjectMatchesDebtsModel(debt, unchangedDebt);
        });
    });

    it('should return an error if debts is already accepted/declined', () => {
      return request(app.getHttpServer())
        .post('/debts/multiple/' + multipleDebt.id + '/creation/accept')
        .set('Authorization', 'Bearer ' + user2.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error', 'Debts not found');
        });
    });
  });


  describe('POST /debts/multiple/:id/creation/decline', () => {

    beforeAll(async () => {
      await Debts.findOneAndDelete({_id: new ObjectId(multipleDebt.id)});

      const {body} = await request(app.getHttpServer())
        .post('/debts/multiple')
        .send({userId: user2.user.id, countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token);

      multipleDebt = body;
    });

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post(`/debts/multiple/${multipleDebt.id}/creation/decline`)
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
        promises.push(request(app.getHttpServer()).post('/debts/multiple/' + param + '/creation/decline').set('Authorization', 'Bearer ' + user1.token));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBeGreaterThanOrEqual(400);
          expect(resp.statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .post('/debts/multiple/' + 'y34ygv4h3' + '/creation/decline')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should return all debts', () => {
      expect(multipleDebt.status).toBe('CREATION_AWAITING');

      return request(app.getHttpServer())
        .post('/debts/multiple/' + multipleDebt.id + '/creation/decline')
        .set('Authorization', 'Bearer ' + user2.token)
        .expect(201)
        .then(resp => {
          const debts = resp.body;
          const unchangedDebt = JSON.parse(JSON.stringify(multipleDebt));
          unchangedDebt.status = 'UNCHANGED';
          unchangedDebt.statusAcceptor = null;
          unchangedDebt.user = user1.user;
          delete unchangedDebt.moneyOperations;

          expect(debts).toHaveProperty('debts');
          expect(Array.isArray(debts.debts)).toBeTruthy();
          debts.debts.forEach(debt => checkIsObjectMatchesDebtsModel(debt, unchangedDebt, false));

          expect(debts).toHaveProperty('summary');
          expect(debts.summary).toHaveProperty('toGive', 0);
          expect(debts.summary).toHaveProperty('toTake', 0);
        });
    });

    it('should return an error if debts is already accepted/declined', () => {
      return request(app.getHttpServer())
        .post('/debts/multiple/' + multipleDebt.id + '/creation/decline')
        .set('Authorization', 'Bearer ' + user2.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error', 'Debts not found');
        });
    });

    it('should delete debt from db', () => {
      return Debts.findOne({_id: new ObjectId(multipleDebt.id)})
        .then((resp) => expect(resp).not.toBeTruthy());
    });

    it('can be deleted by user who\'s created Debts', () => {
      return request(app.getHttpServer())
        .post('/debts/multiple')
        .send({userId: user2.user.id, countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(201)
        .then(resp => multipleDebt = resp.body)
        .then(() => request(app.getHttpServer())
          .post('/debts/multiple/' + multipleDebt.id + '/creation/decline')
          .set('Authorization', 'Bearer ' + user1.token)
          .expect(201))
        .then(resp => {
          const debts = resp.body;
          const unchangedDebt = JSON.parse(JSON.stringify(multipleDebt));
          unchangedDebt.status = 'UNCHANGED';
          unchangedDebt.statusAcceptor = null;
          unchangedDebt.user = user1.user;
          delete unchangedDebt.moneyOperations;

          expect(debts).toHaveProperty('debts');
          expect(Array.isArray(debts.debts)).toBeTruthy();
          debts.debts.forEach(debt => checkIsObjectMatchesDebtsModel(debt, unchangedDebt, false));

          expect(debts).toHaveProperty('summary');
          expect(debts.summary).toHaveProperty('toGive', 0);
          expect(debts.summary).toHaveProperty('toTake', 0);

          return Debts.findOne({_id: new ObjectId(multipleDebt.id)});
        })
        .then((resp) => expect(resp).not.toBeTruthy());
    });
  });


  describe('DELETE /debts/:id', () => {
    let deletedUserDebt;

    beforeAll(async () => {

      const {body} = await request(app.getHttpServer())
        .post('/debts/multiple')
        .send({userId: user2.user.id, countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(201);

      multipleDebt = body;

      await request(app.getHttpServer())
        .post(`/debts/multiple/${multipleDebt.id}/creation/accept`)
        .set('Authorization', 'Bearer ' + user2.token)
        .expect(201);

      const operationPayload = {
        debtsId: multipleDebt.id,
        moneyAmount: 300,
        moneyReceiver: user1.user.id,
        description: 'test'
      };

      await request(app.getHttpServer())
        .post('/operations')
        .send(operationPayload)
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(201);
    });

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).delete(`/debts/${multipleDebt.id}`)
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
        promises.push(request(app.getHttpServer()).delete('/debts/' + param).set('Authorization', 'Bearer ' + user1.token));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBeGreaterThanOrEqual(400);
          expect(resp.statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .delete('/debts/' + 'y34ygv4h3')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should reject user if he is not a user of this Debt entity', () => {

      return request(app.getHttpServer())
        .delete('/debts/' + multipleDebt.id)
        .set('Authorization', 'Bearer ' + user3.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should return all debts to user who\'s deleted', () => {
      return request(app.getHttpServer())
        .delete('/debts/' + multipleDebt.id)
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(200)
        .then(resp => {
          const debts = resp.body;

          expect(debts).toHaveProperty('debts');
          expect(Array.isArray(debts.debts)).toBeTruthy();

          debts.debts.forEach(debt => {
            checkIsObjectMatchesDebtsModel(debt, multipleDebt, false);
          });

          expect(debts).toHaveProperty('summary');
          expect(debts.summary).toHaveProperty('toGive', );
          expect(debts.summary).toHaveProperty('toTake', );
        });
    });

    it('should change Debts type to SINGLE_DEBT & status to USER_DELETED', () => {
      return request(app.getHttpServer())
        .get('/debts/' + multipleDebt.id)
        .set('Authorization', 'Bearer ' + user2.token)
        .expect(200)
        .then(debt => {
          deletedUserDebt = debt.body;
          expect(deletedUserDebt).toHaveProperty('status', 'USER_DELETED');
          expect(deletedUserDebt).toHaveProperty('statusAcceptor', user2.user.id);
          expect(deletedUserDebt).toHaveProperty('type', 'SINGLE_USER');
        });
    });

    it('should create virtual user with the same name as deleted user + with his picture', () => {
      expect(deletedUserDebt.user).toHaveProperty('name', user1.user.name + ' BOT');
      expect(deletedUserDebt.user).toHaveProperty('picture', user1.user.picture);

      return User
        .findOne({_id: new ObjectId(deletedUserDebt.user.id)})
        .then(user => {
          expect(user).toHaveProperty('name', deletedUserDebt.user.name);
          expect(user).toHaveProperty('picture', deletedUserDebt.user.picture);
          expect(user).toHaveProperty('virtual');
          expect(user['virtual']).toBeTruthy();
        });
    });

    it('should change req.user.id on virtual user.id everywhere in Debt & operations', () => {
      return Debts
        .findOne({_id: new ObjectId(deletedUserDebt.id)})
        .then(debt => {
          expect(debt['users'].some(user => user.toString() === deletedUserDebt.user.id.toString())).toBeTruthy();
          expect(JSON.stringify(debt).indexOf(user1.user.id.toString()) === -1).toBeTruthy();
        });
    });

    it('should accept all unaccepted money operations where statusAcceptor === virtualUser', () => {
      deletedUserDebt.moneyOperations
        .every(operation => !(operation.statusAcceptor.toString() === user1.user.id.toString() && operation.status !== 'UNCHANGED'));
    });
  });

  describe('POST /debts/single/:id/i_love_lsd', () => {

    beforeAll(async () => {
      const {body} = await request(app.getHttpServer())
        .post('/debts/multiple')
        .send({userId: user2.user.id, countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token);

      multipleDebt = body;

      await request(app.getHttpServer())
        .post('/debts/multiple/' + multipleDebt.id + '/creation/accept')
        .set('Authorization', 'Bearer ' + user2.token);

      const operationPayload = {
        debtsId: multipleDebt.id,
        moneyAmount: 300,
        moneyReceiver: user1.user.id,
        description: 'test'
      };

      await request(app.getHttpServer())
        .post('/operations')
        .send(operationPayload)
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(201);

      await request(app.getHttpServer())
        .delete('/debts/' + multipleDebt.id)
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(200);

      const {body: body2} = await request(app.getHttpServer())
        .get('/debts/' + multipleDebt.id)
        .set('Authorization', 'Bearer ' + user2.token)
        .expect(200);

      multipleDebt = body2;
    });

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post(`/debts/single/${multipleDebt.id}/i_love_lsd`)
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
        promises.push(request(app.getHttpServer()).post('/debts/single/' + param + '/i_love_lsd').set('Authorization', 'Bearer ' + user1.token));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBeGreaterThanOrEqual(400);
          expect(resp.statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + 'hgfdtryfugki7' + '/i_love_lsd')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should reject user if he is not a user of this Debt entity', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + multipleDebt.id + '/i_love_lsd')
        .set('Authorization', 'Bearer ' + user3.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should change Debt status from USER_DELETE to CHANGE_AWAITING if some operations don\'t have UNCHANGED status', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + multipleDebt.id + '/i_love_lsd')
        .set('Authorization', 'Bearer ' + user2.token)
        .expect(201)
        .then(resp => {
          checkIsObjectMatchesDebtsModel(resp.body, multipleDebt, false);
          expect(resp.body).toHaveProperty('status', 'CHANGE_AWAITING');
          expect(resp.body).toHaveProperty('statusAcceptor', user2.user.id);
        });
    });

    it('should change Debt status from USER_DELETE to UNCHANGED if all operations have UNCHANGED status', () => {

      return request(app.getHttpServer())
        .post('/debts/multiple')
        .send({userId: user2.user.id, countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .then(resp => multipleDebt = resp.body)
        .then(() => {
          return request(app.getHttpServer())
            .post('/debts/multiple/' + multipleDebt.id + '/creation/accept')
            .set('Authorization', 'Bearer ' + user2.token);
        })
        .then(() => {
          const operationPayload = {
            debtsId: multipleDebt.id,
            moneyAmount: 300,
            moneyReceiver: user2.user.id,
            description: 'test'
          };

          return request(app.getHttpServer())
            .post('/operations')
            .send(operationPayload)
            .set('Authorization', 'Bearer ' + user2.token)
            .expect(201);
        })
        .then(() => {
          return request(app.getHttpServer())
            .delete('/debts/' + multipleDebt.id)
            .set('Authorization', 'Bearer ' + user1.token);
        })
        .then(() => {
          return request(app.getHttpServer())
            .get('/debts/' + multipleDebt.id)
            .set('Authorization', 'Bearer ' + user2.token);
        })
        .then(resp => {
          multipleDebt = resp.body;

          return request(app.getHttpServer())
            .post('/debts/single/' + multipleDebt.id + '/i_love_lsd')
            .set('Authorization', 'Bearer ' + user2.token)
            .expect(201)
            .then(resp => {
              checkIsObjectMatchesDebtsModel(resp.body, multipleDebt, false);
              expect(resp.body).toHaveProperty('status', 'UNCHANGED');
              expect(resp.body).toHaveProperty('statusAcceptor', null);
            });
        });
    });
  });

  describe('POST /debts/single/:id/connect_user', () => {

    beforeAll(async () => {
      return request(app.getHttpServer())
        .post('/debts/single')
        .send({userName: 'Valera new', countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .then(({body: debt}) => {
          connectUserDebt = debt;
          connectUserDebtVirtualUser = debt.user;
        });
    });


    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post(`/debts/single/${connectUserDebt.id}/connect_user`).send({userId: user2.user.id})
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
        promises.push(
          request(app.getHttpServer())
            .post('/debts/single/' + param + '/connect_user')
            .send({userId: user2.user.id})
            .set('Authorization', 'Bearer ' + user1.token)
        );
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBeGreaterThanOrEqual(400);
          expect(resp.statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + 'nbjvghfdtr567t8y8' + '/connect_user')
        .send({userId: user2.user.id})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should return 400 if invalid userId is set', () => {
      const promises = [];
      const params = [
        '',
        '/',
        ' ',
        'nkbhgffytui78',
        null,
        undefined
      ];
      const params2 = [
        {user: user2.user.id},
        {userId:user1.user.id}
      ];

      params.forEach(param => {
        promises.push(
          request(app.getHttpServer())
            .post('/debts/single/' + connectUserDebt.id + '/connect_user')
            .send({userId: param})
            .set('Authorization', 'Bearer ' + user1.token)
        );
      });

      params2.forEach(param => {
        promises.push(
          request(app.getHttpServer())
            .post('/debts/single/' + connectUserDebt.id + '/connect_user')
            .send(param)
            .set('Authorization', 'Bearer ' + user1.token)
        );
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBeGreaterThanOrEqual(400);
          expect(resp.statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should reject user if he is not a user of this Debt entity', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + connectUserDebt.id + '/connect_user')
        .send({userId: user2.user.id})
        .set('Authorization', 'Bearer ' + user3.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should send an error if you try to connect user with whom you already have a debt', () => {
      return request(app.getHttpServer())
        .post('/debts/multiple')
        .send({userId: user2.user.id, countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(201)
        .then(() => {
          return request(app.getHttpServer())
            .post('/debts/single/' + connectUserDebt.id + '/connect_user')
            .send({userId: user2.user.id})
            .set('Authorization', 'Bearer ' + user1.token)
            .expect(400);
        })
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should change debts status to CONNECT_USER & status acceptor to userId', () => {
      return request(app.getHttpServer())
        .post('/debts/single/' + connectUserDebt.id + '/connect_user')
        .send({userId: user3.user.id})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(201)
        .then(debt => {
          expect(debt.body).toHaveProperty('status', 'CONNECT_USER');
          expect(debt.body).toHaveProperty('statusAcceptor', user3.user.id);
          checkIsObjectMatchesDebtsModel(debt.body, connectUserDebt, false);
        });
    });

    it('should send an error if you try to connect user to debt that is already waiting for connection', () => {
      return request(app.getHttpServer())
        .post('/debts/single/' + connectUserDebt.id + '/connect_user')
        .send({userId: user3.user.id, countryCode: 'UA'})
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(debt => {
          expect(debt.body).toHaveProperty('error');
        });
    });

    it('should send an error if you try to add an operation to debt that is already waiting for connection', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .send({
          debtsId: connectUserDebt.id,
          moneyAmount: 300,
          moneyReceiver: user2.user.id,
          description: 'test'
        })
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('GET /debts should return debts with status CONNECT_USER and proper status acceptor', () => {
      return request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', 'Bearer ' + user3.token)
        .expect(200)
        .then(resp => {
          const debt = resp.body.debts.find(debt => debt.status === 'CONNECT_USER');
          expect(debt).toBeTruthy();
          expect(debt).toHaveProperty('status', 'CONNECT_USER');
          expect(debt).toHaveProperty('statusAcceptor', user3.user.id);
        });
    });

    it('GET /debts/:id should return debts and change virtual user to user', () => {
      return request(app.getHttpServer())
        .get('/debts/' + connectUserDebt.id)
        .set('Authorization', 'Bearer ' + user3.token)
        .expect(200)
        .then(resp => {
          const debt = resp.body;
          expect(debt).toBeTruthy();
          expect(debt).toHaveProperty('status', 'CONNECT_USER');
          expect(debt).toHaveProperty('statusAcceptor', user3.user.id);
        });
    });
  });


  describe('POST /debts/single/:id/connect_user/accept', () => {


    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post(`/debts/single/${connectUserDebt.id}/connect_user/accept`)
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
        promises.push(
          request(app.getHttpServer())
            .post('/debts/single/' + param + '/connect_user/accept')
            .set('Authorization', 'Bearer ' + user1.token)
        );
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBeGreaterThanOrEqual(400);
          expect(resp.statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + 'nkbhjvghcfgdtryu' + '/connect_user/accept')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should reject user if he is not a user of this Debt entity', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + connectUserDebt.id + '/connect_user/accept')
        .set('Authorization', 'Bearer ' + user2.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should send an error if you try to accept it with no status acceptor user', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + connectUserDebt.id + '/connect_user/accept')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should change status to UNCHANGED, statusAcceptor to null & type to MULTIPLE_USERS', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + connectUserDebt.id + '/connect_user/accept')
        .set('Authorization', 'Bearer ' + user3.token)
        .expect(201)
        .then(({body: debt}) => {
          expect(debt).toHaveProperty('status', 'UNCHANGED');
          expect(debt).toHaveProperty('statusAcceptor', null);
          expect(debt).toHaveProperty('type', 'MULTIPLE_USERS');

          connectUserDebt = debt;
        });
    });

    it('should send an error if you try to accept it one more time', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + connectUserDebt.id + '/connect_user/accept')
        .set('Authorization', 'Bearer ' + user3.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should change virtual user id on user id everywhere (moneyReceiver)', () => {
      expect(JSON.stringify(connectUserDebt).indexOf(connectUserDebtVirtualUser.id) === -1).toBeTruthy();
      expect(JSON.stringify(connectUserDebt).indexOf(user3.user.id) !== -1);
    });

    it('should delete virtual user from db', () => {
      return User
        .findOne({_id: new ObjectId(connectUserDebtVirtualUser.id)})
        .then(user => expect(user).toBeFalsy());
    });

    it('should delete virtual user picture from fs', (done) => {
      fs.exists('public/images/' + connectUserDebtVirtualUser.picture.match(/[^\/]*$/), (exists) => {
        expect(exists).toBe(false);
        done();
      });
    });
  });


  describe('POST /debts/single/:id/connect_user/decline', () => {

    beforeAll(async () => {
      connectUserDebt = await createConnectUserDebt();
      connectUserDebtVirtualUser = connectUserDebt.user;
    });


    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post(`/debts/single/${connectUserDebt.id}/connect_user/decline`)
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
        promises.push(
          request(app.getHttpServer())
            .post('/debts/single/' + param + '/connect_user/decline')
            .set('Authorization', 'Bearer ' + user3.token)
        );
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBeGreaterThanOrEqual(400);
          expect(resp.statusCode).toBeLessThanOrEqual(404);
        });
      });
    });

    it('should return 400 if invalid param is set', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + 'nkbhjvghcfgdtryu' + '/connect_user/decline')
        .set('Authorization', 'Bearer ' + user3.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should reject user if he is not a user of this Debt entity', () => {

      return request(app.getHttpServer())
        .post('/debts/single/' + connectUserDebt.id + '/connect_user/decline')
        .set('Authorization', 'Bearer ' + user1.token)
        .expect(400)
        .then(resp => {
          expect(resp.body).toHaveProperty('error');
        });
    });

    it('should accept connected user request', async () => {

      await request(app.getHttpServer())
        .post('/debts/single/' + connectUserDebt.id + '/connect_user/decline')
        .set('Authorization', 'Bearer ' + user3.token)
        .expect(201);

      await Debts.findOne({_id: new ObjectId(connectUserDebt.id)})
        .then(debt => {
          expect(debt).toHaveProperty('status', DebtsStatus.UNCHANGED);
          expect(debt).toHaveProperty('statusAcceptor', null);
        });
    });

    it('should accept main user request', async () => {
      await Debts.deleteOne({_id: new ObjectId(connectUserDebt.id)});
      const connectUserDebt2 = await createConnectUserDebt();

      await request(app.getHttpServer())
        .post(`/debts/single/${connectUserDebt2.id}/connect_user/decline`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(201);

      await Debts.findOne({_id: new ObjectId(connectUserDebt2.id)})
        .then(debt => {
          expect(debt).toHaveProperty('status', DebtsStatus.UNCHANGED);
          expect(debt).toHaveProperty('statusAcceptor', null);
        });
    });

    async function createConnectUserDebt(): Promise<DebtInterface> {
      const {body: debt} = await request(app.getHttpServer())
        .post('/debts/single')
        .send({userName: 'Valera new', countryCode: 'UA'})
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(201);

      const {body: debt2} = await request(app.getHttpServer())
        .post(`/debts/single/${debt.id}/connect_user`)
        .send({userId: user3.user.id})
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(201);

      return debt2;
    }
  });



  function checkIsObjectMatchesDebtsModel(object, debtsModel: DebtDto, checkKeys = true): void {
    Object.keys(debtsModel).forEach(key => {
      if(checkKeys) {
        expect(object).toHaveProperty(key, debtsModel[key]);
      } else {
        expect(object).toHaveProperty(key);
      }
    });
  }
});

