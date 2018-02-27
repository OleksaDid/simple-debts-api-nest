import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { HealthController } from './health.controller';
import { expect } from 'chai';

describe('HealthController', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      controllers: [
        HealthController
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let controller: HealthController;
  beforeEach(() => {
    controller = module.get(HealthController);
  });

  it('should exist', () => {
    expect(controller).to.exist;
  });
});
