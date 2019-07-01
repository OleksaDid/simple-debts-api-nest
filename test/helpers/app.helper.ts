import {INestApplication} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {ApplicationModule} from '../../src/app/app.module';
import {ModelValidationPipe} from '../../src/app/pipes/model-validation.pipe';
import {HttpWithExceptionFilter} from '../../src/app/filters/http-exception.filter';

export class AppHelper {

  static async getTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app
      .useGlobalPipes(new ModelValidationPipe())
      .useGlobalFilters(new HttpWithExceptionFilter())
      .init();

    return app;
  }

}
