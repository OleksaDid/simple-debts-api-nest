import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { OperationsService } from './operations.service';
import { expect } from 'chai';

describe('OperationsService', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      components: [
        OperationsService
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let service: OperationsService;
  beforeEach(() => {
    service = module.get(OperationsService);
  });

  it('should exist', () => {
    expect(service).to.exist;
  });
});
