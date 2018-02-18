import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { DebtsMultipleController } from './de-multiple.controller.ts';
import { expect } from 'chai';

describe('DebtsMultipleController', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      controllers: [
        DebtsMultipleController
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let controller: DebtsMultipleController;
  beforeEach(() => {
    controller = module.get(DebtsMultipleController);
  });

  it('should exist', () => {
    expect(controller).to.exist;
  });
});
