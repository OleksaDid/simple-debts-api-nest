import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { DebtsSingleService } from './de-single.service.ts';
import { expect } from 'chai';

describe('DebtsSingleService', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      components: [
        DebtsSingleService
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let service: DebtsSingleService;
  beforeEach(() => {
    service = module.get(DebtsSingleService);
  });

  it('should exist', () => {
    expect(service).to.exist;
  });
});
