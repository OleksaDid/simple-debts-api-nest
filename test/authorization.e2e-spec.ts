import * as request from 'supertest';
import {AppHelper} from './helpers/app.helper';

import * as dotenv from 'dotenv';
import {EnvField} from '../src/app/modules/config/models/env-field.enum';
dotenv.config({ path: __dirname + '/../config/test.env' });

const credentials = require('./fixtures/auth-user');


describe('Authorization (e2e)', () => {
  let app;

  beforeEach(async () => {
    app = await AppHelper.getTestApp();
  });


  describe('POST /sign_up/local', () => {

    it('should return OnLogin model', () => {
      const newCredentials = getNewCredentials();

      return request(app.getHttpServer())
        .post('/sign_up/local')
        .send(newCredentials)
        .expect(201)
        .then(response => {
          checkIsResponseMatchesOnLoginModel(response, newCredentials);
        });
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
        .then(response => {
          checkIsResponseMatchesOnLoginModel(response, credentials);
        });
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

    it('should return 200 & OnLogin if user uses correct token', () => {

      return request(app.getHttpServer())
        .get('/login/facebook')
        .set('Authorization', 'Bearer ' + process.env[EnvField.FACEBOOK_TEST_USER_TOKEN])
        .expect(200)
        .then(resp => {
          checkIsResponseMatchesOnLoginModel(resp);
        });
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

  function checkIsResponseMatchesOnLoginModel(response, credentials?): void {
    const emailName = /^.*(?=@)/;

    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.id).toBeTruthy();

    expect(response.body.user).toHaveProperty('name');

    let picUrlRegex;

    if(credentials) {
      expect(response.body.user.name).toBe(credentials.email.match(emailName)[0]);
      picUrlRegex = /http:\/\/(localhost|127\.0\.0\.1):\d{5}(\/images\/.*\.png)/;
    } else {
      picUrlRegex = /https:\/\/graph\.facebook\.com\/.*\/picture\?type=large/;
    }

    expect(response.body.user.picture).toMatch(picUrlRegex);

    expect(response.body.user).toHaveProperty('picture');

    expect(typeof response.body.user.picture).toBe('string');


    expect(response.body).toHaveProperty('token');
    expect(response.body.token).toBeTruthy();
    expect(typeof response.body.token).toBe('string');
  }
});

