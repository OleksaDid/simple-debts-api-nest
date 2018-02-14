import {Test} from '@nestjs/testing';
import {TestingModule} from '@nestjs/testing/testing-module';
import {AuthenticationService} from './authentication.service';
import {expect} from 'chai';

describe('AuthenticationService', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      components: [
        AuthenticationService
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let service: AuthenticationService;
  beforeEach(() => {
    service = module.get(AuthenticationService);
  });

  it('should exist', () => {
    expect(service).to.exist;
  });
});
