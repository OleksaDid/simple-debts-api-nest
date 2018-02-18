import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { DebtsService } from './de.service.ts';
import { expect } from 'chai';

describe('DebtsService', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      components: [
        DebtsService
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let service: DebtsService;
  beforeEach(() => {
    service = module.get(DebtsService);
  });

  it('should exist', () => {
    expect(service).to.exist;
  });
});
