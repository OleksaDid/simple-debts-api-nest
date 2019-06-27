import * as request from 'supertest';
import * as superagent from 'superagent';
import {INestApplication, Logger} from '@nestjs/common';
import {AuthUser} from '../../src/app/modules/authentication/models/auth-user';
import {LocalAuthentication} from '../../src/app/modules/authentication/models/local-authentication';
import {FacebookTestUser} from './models/facebook-test-user';
import {EnvField} from '../../src/app/modules/config/models/env-field.enum';

import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../../config/test.env' });

export class AuthenticationHelper<T extends INestApplication = INestApplication> {
  private _app: T;

  constructor(app: T) {
    this._app = app;
  }

  async authenticateUser(credentials: LocalAuthentication): Promise<AuthUser> {
    try {
      await request(this._app.getHttpServer())
        .post('/sign_up/local')
        .send(credentials);
    } catch(err) {
      Logger.log(`User ${credentials.email} is already signed up`);
    }

    try {
      const {body} = await request(this._app.getHttpServer())
        .post('/login/local')
        .send(credentials)
        .expect(201);

      return body;
    } catch(err) {
      Logger.error(`Authentication of ${credentials.email} failed`);
    }
  }

  async testAuthorizationGuard(request: request.Request): Promise<void> {
    const promises = [];

    promises.push(request);
    promises.push(request.set('Authorization', 'Bearer '));
    promises.push(request.set('Authorization', 'Bearer KJHFxjfhgIY6r756DRTg86F&%rctjyUG&*6f5rC'));

    const responses = await Promise.all(promises);

    responses.forEach(response => expect(response.statusCode).toBe(401));
  }

  async getFacebookTestUserToken(): Promise<string> {
    const [testUser] = await this._getFacebookTestUsers();
    return testUser.access_token;
  }


  private async _getFacebookTestUsers(): Promise<FacebookTestUser[]> {
    const agent = superagent.agent();
    const facebookUrl = `https://graph.facebook.com/v3.3/${process.env[EnvField.FACEBOOK_ID]}/accounts/test-users`;

    const {text} = await agent
      .get(facebookUrl)
      .set('Authorization', `Bearer ${process.env[EnvField.FACEBOOK_APP_TOKEN]}`);

    const {data} = JSON.parse(text);

    return data;
  }
}
