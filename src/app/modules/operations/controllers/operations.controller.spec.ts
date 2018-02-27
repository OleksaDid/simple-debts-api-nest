import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { OperationsController } from './operations.controller';
import { expect } from 'chai';

describe('OperationsController', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      controllers: [
        OperationsController
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let controller: OperationsController;
  beforeEach(() => {
    controller = module.get(OperationsController);
  });

  it('should exist', () => {
    expect(controller).to.exist;
  });
});
