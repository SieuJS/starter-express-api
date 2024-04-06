const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");

passport.serializeUser((userId, done) => {
    done(null, userId);
});

passport.deserializeUser((userId, done) => {
    done(null, userId);
});

module.exports = (app) => {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
    new GoogleStrategy({
        clientID: "865295487079-akv1tle2d37bplmsrdnn6be1mhivrac1.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: "https://localhost:3000/auth/google/redirect"
    }, (accessToken, refreshToken, profile, done) => {
        // call done to change next stage
        done(null, profile.id);
    }));

}