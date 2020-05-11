import * as request from 'supertest';
import {AuthenticationHelper} from './helpers/authentication.helper';
import {AppHelper} from './helpers/app.helper';
import {AuthUser} from '../src/app/modules/authentication/models/auth-user';

const credentials = require('./fixtures/test-user');
let user: AuthUser;

describe('Common Module (e2e)', () => {
  let app;
  let authHelper: AuthenticationHelper;

  beforeEach(async () => {
    app = await AppHelper.getTestApp();
    authHelper = new AuthenticationHelper(app);
    user = await authHelper.authenticateUser(credentials);
  });

  describe('GET /common/currency', () => {

    it('should return 401 error if token is invalid', () => {
      return authHelper.testAuthorizationGuard(
        request(app.getHttpServer()).get('/common/currency').query({ val: 'ol' })
      );
    });

    it('should return an array of currencies', () => {

      return request(app.getHttpServer())
        .get('/common/currency')
        .set('Authorization', 'Bearer ' + user.token)
        .expect(200)
        .then(res => {
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toBeGreaterThan(200);

          res.body.forEach(currency => {
            expect(currency).toHaveProperty('countryName');
            expect(currency).toHaveProperty('iso');
            expect(currency).toHaveProperty('currency');
            expect(currency).toHaveProperty('symbol');
          });
        });
    });
  });
});
