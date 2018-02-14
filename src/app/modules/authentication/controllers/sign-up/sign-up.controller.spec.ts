import {Test} from '@nestjs/testing';
import {TestingModule} from '@nestjs/testing/testing-module';
import {SignUpController} from './sign-up.controller';
import {expect} from 'chai';

describe('SignUpController', () => {
  let module: TestingModule;
  beforeEach(() => {
    return Test.createTestingModule({
      controllers: [
        SignUpController
      ]
    }).compile()
      .then(compiledModule => module = compiledModule);
  });

  let controller: SignUpController;
  beforeEach(() => {
    controller = module.get(SignUpController);
  });

  it('should exist', () => {
    expect(controller).to.exist;
  });
});
