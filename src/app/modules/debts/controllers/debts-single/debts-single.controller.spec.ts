import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { DebtsSingleController } from './de-single.controller.ts';
import { expect } from 'chai';

describe('DebtsSingleController', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      controllers: [
        DebtsSingleController
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let controller: DebtsSingleController;
  beforeEach(() => {
    controller = module.get(DebtsSingleController);
  });

  it('should exist', () => {
    expect(controller).to.exist;
  });
});
