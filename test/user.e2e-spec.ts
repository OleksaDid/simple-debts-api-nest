import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import {ApplicationModule} from '../src/app/app.module';
import {HttpWithExceptionFilter} from '../src/app/filters/http-exception.filter';
import {ModelValidationPipe} from '../src/app/pipes/model-validation.pipe';


const credentials = {
  email: 'real_avatarr122@mail.ru',
  password: 'a998877'
};

let token = '';
let previousUserData;


describe('Users (e2e)', () => {
  let app;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app
      .useGlobalPipes(new ModelValidationPipe())
      .useGlobalFilters(new HttpWithExceptionFilter())
      .init();

    await request(app.getHttpServer())
      .post('/login/local')
      .send(credentials)
      .then(res => {
        token = res.body.token;
        previousUserData = res.body.user;
      });
  });


  describe('GET /users', () => {

    it('should return 401 error if token is invalid', () => {
      const promises = [];

      promises.push(request(app.getHttpServer()).get('/users').query({ val: 'ol' }));
      promises.push(request(app.getHttpServer()).get('/users').query({ val: 'ol' }).set('Authorization', 'Bearer '));
      promises.push(request(app.getHttpServer()).get('/users').query({ val: 'ol' }).set('Authorization', 'Bearer KJHFxjfhgIY6r756DRTg86F&%rctjyUG&*6f5rC'));

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBe(401);
        });
      });
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
        promises.push(request(app.getHttpServer()).get('/users').query(params).set('Authorization', 'Bearer ' + token));
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(res => {
            expect(res.statusCode).toBe(400);
          });
        });
    });

    it('should return an array of users', () => {
      const regex = 'real';

      return request(app.getHttpServer())
        .get('/users')
        .query({ name:  regex})
        .set('Authorization', 'Bearer ' + token)
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

    it('should return 401 error if token is invalid', () => {
      const promises = [];

      promises.push(request(app.getHttpServer()).post('/users').send({name: 'Alex'}));
      promises.push(request(app.getHttpServer()).post('/users').send({name: 'Alex'}).set('Authorization', 'Bearer '));
      promises.push(request(app.getHttpServer()).post('/users').send({name: 'Alex'}).set('Authorization', 'Bearer KJHFxjfhgIY6r756DRTg86F&%rctjyUG&*6f5rC'));

      return Promise.all(promises).then(responses => {
        responses.forEach(resp => {
          expect(resp.statusCode).toBe(401);
        });
      });
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
        promises.push(request(app.getHttpServer()).post('/users').send(params).set('Authorization', 'Bearer ' + token));
      });

      return Promise.all(promises)
        .then(responses => {
          responses.forEach(res => {
            expect(res.statusCode).toBe(400);
          });
        });
    });

    it('should update username', () => {
      const data = {name: 'Alex'};

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', 'Bearer ' + token)
        .send(data)
        .expect(201)
        .then(response => {
          expect(response.body).toHaveProperty('name', data.name);

          expect(response.body).toHaveProperty('picture', previousUserData.picture);
          expect(response.body).toHaveProperty('id', previousUserData.id);
        });
    });

    it('should update image', () => {
      const data = {name: 'Alex'};

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', 'Bearer ' + token)
        .attach('image', __dirname + '/files/avatar.png')
        .field('name', 'Alex')
        .expect(201)
        .then(response => {
          expect(response.body).toHaveProperty('name', data.name);

          expect(response.body).toHaveProperty('picture');
          expect(response.body.picture).not.toBe(previousUserData.picture);

          expect(response.body).toHaveProperty('id', previousUserData.id);
        });
    });
  });
});

