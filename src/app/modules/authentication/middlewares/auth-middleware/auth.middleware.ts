import * as passport from 'passport';
import {AuthStrategy} from '../../strategies-list.enum';

export function authMiddlewareFactory(strategy: AuthStrategy) {
    return (req, res, next) => passport.authenticate(strategy, {session: false})(req, res, next);
}
