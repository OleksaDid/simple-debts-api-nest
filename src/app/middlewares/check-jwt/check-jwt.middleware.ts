import * as passport from 'passport';

const checkJWTAccess = passport.authenticate('jwt', { session: false });

export default checkJWTAccess;