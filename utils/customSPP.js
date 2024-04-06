const {Strategy} = require("passport-strategy");
const passport = require("passport");

module.exports = class MyStrategy extends Strategy {
    constructor(verify, options) {
        super();
        this.name = 'myStrategy';
        this.verify = verify;
        this.usernameField = (options && options.username) ? options.username : "username";
        this.passwordField = (options && options.password) ? options.password : "password";
        passport.strategies[this.name] = this;
    }

    authenticate(req, options) {
        const un = req.body[this.usernameField];
        const pw = req.body[this.passwordField];
        this.verify(un, pw, (err, user) => {
            if (err) {
                return this.fail(err);
            }

            if (!user) {
                return this.fail("invalid auth login");
            }

            this.success(user);
        });
    }
}