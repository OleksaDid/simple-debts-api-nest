import * as request from 'supertest';
import {AuthUser} from '../src/app/modules/authentication/models/auth-user';
import {AuthenticationHelper} from './helpers/authentication.helper';
import {AppHelper} from './helpers/app.helper';
import {UserInterface} from '../src/app/modules/users/models/user.interface';
import {Collection} from 'mongodb';
import {DbHelper} from './helpers/db.helper';
import {EnvField} from '../src/app/modules/config/models/env-field.enum';
import {Logger} from '@nestjs/common';
import * as mongoose from "mongoose";

const credentials = require('./fixtures/test-user');
let user: AuthUser;

const Chance = require('chance');
const chance = new Chance();

const ObjectId = mongoose.Types.ObjectId;


describe('Users (e2e)', () => {
  let app;
  let authHelper: AuthenticationHelper;
  let Users: Collection<UserInterface>;

  beforeEach(async () => {
    app = await AppHelper.getTestApp();

    authHelper = new AuthenticationHelper(app);

    user = await authHelper.authenticateUser(credentials);

    const dbHelper = new DbHelper(process.env[EnvField.MONGODB_URI]);
    await dbHelper.init();
    Users = dbHelper.Users;
  });


  describe('GET /users', () => {

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).get('/users').query({ val: 'ol' })
      );
    });

    it('should return an error if there is no query param', () => {
      const promises = [];

      const queryParams = [
        {},
        {name: ''},
        {name: null},
        {surname: 'Shto'}
      ];

      queryParams.forEach(params => {
        promises.push(request(app.getHttpServer()).get('/users').query(params).set('Authorization', 'Bearer ' + user.token));
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(res => {
            expect(res.statusCode).toBe(400);
          });
        });
    });

    it('should return an array of users', () => {
      const regex = 'a';

      return request(app.getHttpServer())
        .get('/users')
        .query({ name:  regex})
        .set('Authorization', 'Bearer ' + user.token)
        .expect(200)
        .then(res => {
          expect(Array.isArray(res.body)).toBeTruthy();

          res.body.forEach(user => {
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('name');
            expect(user).toHaveProperty('picture');

            expect(user.name).toMatch(new RegExp(regex, 'i'));
            expect(user.name.indexOf('BOT') === -1).toBeTruthy();
          });
        });
    });
  });


  describe('POST /users', () => {
    const updateData = {name: chance.name()};

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).post('/users').send({name: 'Alex'})
      );
    });

    it('should return an error if there is no name param', () => {
      const promises = [];

      const params = [
        {},
        {name: ''},
        {name: null},
        {surname: 'Shto'}
      ];

      params.forEach(params => {
        promises.push(request(app.getHttpServer()).post('/users').send(params).set('Authorization', 'Bearer ' + user.token));
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(res => {
            expect(res.statusCode).toBe(400);
          });
        });
    });

    it('should update username', () => {

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', 'Bearer ' + user.token)
        .send(updateData)
        .expect(201)
        .then(({body}) => {
          expect(body).toHaveProperty('name', updateData.name);

          expect(body).toHaveProperty('picture', user.user.picture);
          expect(body).toHaveProperty('id', user.user.id);
        });
    });

    it('should update image', () => {

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', 'Bearer ' + user.token)
        .attach('image', __dirname + '/files/avatar.png')
        .field('name', updateData.name)
        .expect(201)
        .then(({body}) => {
          expect(body).toHaveProperty('name', updateData.name);

          expect(body).toHaveProperty('picture');
          expect(body.picture).not.toBe(user.user.picture);

          expect(body).toHaveProperty('id', user.user.id);
        });
    });
  });

  describe('POST /users/push_tokens', () => {

    it('should add token to tokens array in user object and return 201', async () => {
      const token = 'kjnbhgvf56r76879';

      await request(app.getHttpServer())
        .post('/users/push_tokens')
        .send({token})
        .set('Authorization', 'Bearer ' + user.token)
        .expect(201);

      const {pushTokens} = await Users.findOne({_id: new ObjectId(user.user.id)});

      expect(Array.isArray(pushTokens)).toBeTruthy();
      expect(pushTokens.includes(token)).toBeTruthy();
      expect(pushTokens).toHaveLength(1)
    });

    it('should return 201 if token already exists', async () => {
      const token = 'kjnbhgvf56r76879';

      await request(app.getHttpServer())
        .post('/users/push_tokens')
        .send({token})
        .set('Authorization', 'Bearer ' + user.token)
        .expect(201);

      const {pushTokens} = await Users.findOne({_id: new ObjectId(user.user.id)});

      expect(Array.isArray(pushTokens)).toBeTruthy();
      expect(pushTokens.includes(token)).toBeTruthy();
      expect(pushTokens).toHaveLength(1)
    });

    it('should reject invalid tokens', () => {
      const promises = [];

      const params = [
        {},
        {token: ''},
        {token: null},
        {kek: 'Shto'}
      ];

      params.forEach(params => {
        promises.push(request(app.getHttpServer()).post('/users/push_tokens').send(params).set('Authorization', 'Bearer ' + user.token));
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(res => {
            expect(res.statusCode).toBe(400);
          });
        });
    });
  });
});

