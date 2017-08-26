const User = require('../models/user');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const config = require('./env');

module.exports = (passport) => {
    opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.application.secret
    };
    passport.use(new JwtStrategy(opts, (jwtPayload, done) => {
        let userId = jwtPayload.userId;
        User.findByUserId(userId, (err, user) => {
            if(!err){
                if(user){
                    return done(null, user);                                
                }
                else{
                    return done(null, false);                                
                }
            }
            else{
                return done(err, false);
            }
        });        
    }));
}