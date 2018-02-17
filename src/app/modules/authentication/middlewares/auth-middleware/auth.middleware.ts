import * as passport from 'passport';
import {AuthStrategy} from '../../strategies/strategies-list.enum';
import {Middleware} from '@nestjs/common';
import {NestMiddleware} from '@nestjs/common/interfaces/middlewares';

@Middleware()
export class AuthMiddleware implements NestMiddleware {
    resolve(strategy: AuthStrategy): (req, res, next) => void {
        return (req, res, next) => passport.authenticate(strategy, {session: false})(req, res, next)
    }
}
