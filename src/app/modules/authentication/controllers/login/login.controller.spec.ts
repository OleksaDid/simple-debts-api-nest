import {Test} from '@nestjs/testing';
import {TestingModule} from '@nestjs/testing/testing-module';
import {AuthenticationController} from './login.controller';
import {expect} from 'chai';

describe('AuthenticationController', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      controllers: [
        AuthenticationController
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let controller: AuthenticationController;
  beforeEach(() => {
    controller = module.get(AuthenticationController);
  });

  it('should exist', () => {
    expect(controller).to.exist;
  });
});
