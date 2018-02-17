import * as passport from 'passport';
import {AuthStrategy} from '../../strategies/strategies-list.enum';

const checkJWTAccess = passport.authenticate(AuthStrategy.JWT_STRATEGY, { session: false });

export default checkJWTAccess;