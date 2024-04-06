const passport = require("passport");
const MyStrategy = require("../utils/customSPP.js");
const accM = require("../models/acc.m.js");
const bcrypt = require("bcrypt");

passport.serializeUser((user, done) => {
    done(null, user.Username);
});

passport.deserializeUser(async (userName, done) => {
    const user = await accM.getByUsername(userName);
    if (!user) {
        return done("invalid user deserialization", null);
    }
    done(null, user);
});

module.exports = (app) => {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new MyStrategy(async (un, pw, done) => {
        const rs = await accM.getByUsername(un);
        let auth = false;
        if (rs) {
            auth = await bcrypt.compare(pw, rs.Password);
        }
        if (auth) {
            return done(null, rs);
        }
        done("invalid auth login", null);
    }));

}