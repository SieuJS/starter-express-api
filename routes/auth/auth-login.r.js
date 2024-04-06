const express = require("express");
const router = express.Router();
const passport = require("passport");

// Login with username and password

router.post("/", passport.authenticate("myStrategy", {
    failureRedirect: "/"
}), (req, res) => {
    res.json({message: "Login successfully"});
});

module.exports = router;