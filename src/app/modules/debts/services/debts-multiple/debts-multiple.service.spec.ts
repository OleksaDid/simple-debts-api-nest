import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { DebtsMultipleService } from './debts-multiple.service';
import { expect } from 'chai';

describe('DebtsMultipleService', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      components: [
        DebtsMultipleService
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let service: DebtsMultipleService;
  beforeEach(() => {
    service = module.get(DebtsMultipleService);
  });

  it('should exist', () => {
    expect(service).to.exist;
  });
});
