import * as request from 'supertest';
import {AppHelper} from './helpers/app.helper';


describe('AppController (e2e)', () => {
  let app;

  beforeEach(async () => {
    app = await AppHelper.getTestApp();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect('ok');
  });
});
