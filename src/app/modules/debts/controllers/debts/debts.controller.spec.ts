import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { DebtsController } from './de.controller.ts';
import { expect } from 'chai';

describe('DebtsController', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      controllers: [
        DebtsController
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let controller: DebtsController;
  beforeEach(() => {
    controller = module.get(DebtsController);
  });

  it('should exist', () => {
    expect(controller).to.exist;
  });
});
