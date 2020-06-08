import * as request from 'supertest';
import {AppHelper} from './helpers/app.helper';
import {AuthUser} from '../src/app/modules/authentication/models/auth-user';
import {validate} from 'class-validator';
import {plainToClass} from 'class-transformer';
import {AuthenticationHelper} from './helpers/authentication.helper';
import {RequestHelper} from './helpers/request-helper';
import {Logger} from '@nestjs/common';

const credentials = require('./fixtures/auth-user');


describe('Authorization (e2e)', () => {
  let app;
  let authHelper: AuthenticationHelper;

  beforeEach(async () => {
    app = await AppHelper.getTestApp();
    authHelper = new AuthenticationHelper(app);
  });


  describe('POST /sign_up/local', () => {

    it('should return OnLogin model', () => {
      const newCredentials = getNewCredentials();

      return request(app.getHttpServer())
        .post('/sign_up/local')
        .send(newCredentials)
        .expect(201)
        .then(({body}) => checkIsResponseMatchesOnLoginModel(body, newCredentials));
    });

    it('should throw an error if user already exists', () => {
      return request(app.getHttpServer())
        .post('/sign_up/local')
        .send(credentials)
        .expect(400)
        .then(response => {
          expect(response.body).toHaveProperty('error', 'User with this email already exists');
        });
    });

    it('should throw an error if email is wrong', () => {
      const emails = ['plainaddress', '#@%^%#$@#$@#.com', '@yandex.ru', 'Joe Smith <email@domain.com>',
        'email.domain.com', 'email@domain@domain.com', '.email@domain.com', 'email.@domain.com',
        'email..email@domain.com', 'email@domain.com (Joe Smith)', 'email@domain',
        'email@111.222.333.44444', 'email@domain..com'];

      const promises = emails.map(email => {
        return request(app.getHttpServer())
          .post('/sign_up/local')
          .send(Object.assign({}, credentials, {email}));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(response => {
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error', 'Email is wrong');
        });
      });
    });

    it('should throw an error if password length is invalid', () => {
      const newCredentials = getNewCredentials();

      const passwords = ['12345', '123456789012345678901'];

      const promises = passwords.map(password => {
        return request(app.getHttpServer())
          .post('/sign_up/local')
          .send(Object.assign({}, newCredentials, {password}));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(response => {
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error', 'Invalid password length');
        });
      });
    });

    it('should return an error if there is no password or email', () => {
      const creds = [{
        email: credentials.email
      }, {
        password: credentials.password
      }];

      const promises = creds.map(cred => {
        return request(app.getHttpServer())
          .post('/sign_up/local')
          .send(Object.assign({}, cred));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(response => {
          expect(response.status).toBe(401);
        });
      });
    });
  });



  describe('POST /login/local', () => {

    it('should return OnLogin model', () => {
      return request(app.getHttpServer())
        .post('/login/local')
        .send(credentials)
        .expect(201)
        .then(({body}) => checkIsResponseMatchesOnLoginModel(body, credentials));
    });

    it('should return an error if there is no user with such email', () => {
      return request(app.getHttpServer())
        .post('/login/local')
        .send(Object.assign({}, credentials, {email: 'testtesttest@test.com'}))
        .expect(400)
        .then(response => {
          expect(response.body).toHaveProperty('error', 'No user is found');
        });
    });

    it('should return an error if password is incorrect', () => {
      return request(app.getHttpServer())
        .post('/login/local')
        .send(Object.assign({}, credentials, {password: 'iaminvalidhelpme'}))
        .expect(400)
        .then(response => {
          expect(response.body).toHaveProperty('error', 'Wrong password');
        });
    });

    it('should return an error if there is no password or email', () => {
      const creds = [{
        email: credentials.email
      }, {
        password: credentials.password
      }];

      const promises = creds.map(cred => {
        return request(app.getHttpServer())
          .post('/login/local')
          .send(Object.assign({}, cred));
      });

      return Promise.all(promises).then(responses => {
        responses.forEach(response => {
          expect(response.status).toBe(401);
        });
      });
    });
  });




  describe('GET /login/facebook', () => {

    it('should return 401 & error if doesn\'t use token', () => {
      const promises = [];

      promises.push(request(app.getHttpServer()).get('/login/facebook'));
      promises.push(request(app.getHttpServer()).get('/login/facebook').set('Authorization', 'Bearer '));

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBe(401);
          expect(resp.body).toHaveProperty('error');
        });
      });
    });

    it('should return 401 & error if use incorrect token', () => {
      const promises = [];

      promises.push(request(app.getHttpServer()).get('/login/facebook').set('Authorization', 'Bearer KJHFxjfhgIY6r756DRTg86F&%rctjyUG&*6f5rC'));

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBe(500);
          expect(resp.body).toHaveProperty('error');
        });
      });
    });

    it('should return 200 & OnLogin if user uses correct token', async () => {
      const testUserToken = await authHelper.getFacebookTestUserToken();

      return request(app.getHttpServer())
        .get('/login/facebook')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)
        .then(({body}) => checkIsResponseMatchesOnLoginModel(body));
    });
  });



  describe('GET /login/status', () => {

    it('should return 401 if doesn\'t use correct token', () => {
      const promises = [];

      promises.push(request(app.getHttpServer()).get('/login/status'));
      promises.push(request(app.getHttpServer()).get('/login/status').set('Authorization', 'Bearer '));

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => expect(resp.statusCode).toBe(401));
      });
    });

    it('should return 200 if user uses correct token', () => {

      return request(app.getHttpServer()).post('/login/local')
        .send(credentials)
        .then(response => {

          return request(app.getHttpServer()).get('/login/status')
            .set('Authorization', 'Bearer ' + response.body.token)
            .expect(200);
        });
    });
  });





  function getNewCredentials(): {email: string, password: string} {
    const emailName = /^.*(?=@)/;

    return Object.assign({}, credentials, {
      email: Object.assign({}, credentials).email.replace(
        emailName,
        credentials.email.match(emailName)[0] + Math.floor(Math.random() * 10000)
      )
    });
  }

  async function checkIsResponseMatchesOnLoginModel(user: AuthUser, credentials?: {email: string, password: string}): Promise<void> {
    const errors = await validate(plainToClass(AuthUser, user));
    expect(errors).toHaveLength(0);

    const emailName = /^.*(?=@)/;

    if(credentials) {
      expect(user.user.name).toBe(credentials.email.match(emailName)[0]);
      expect(user.user.picture).toBeTruthy();

      await RequestHelper
        .getImage(user.user.picture)
        .expect(({status}) => expect(status).toBeLessThan(400));
    } else {
      const picUrlRegex = /https:\/\/graph\.facebook\.com\/.*\/picture\?type=large/;
      expect(user.user.picture).toMatch(picUrlRegex);
    }

  }
});

