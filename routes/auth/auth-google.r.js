const express = require("express");
const router = express.Router();
const accGoogleController = require("../../controllers/google/acc-google.c");
const checkAuth = require("../../middlewares/check-auth");

// authenticate with Google
router.get("/:id", accGoogleController.getUserById);
router.get("/check/:id", accGoogleController.loginWithGoogle);
router.post("/register", accGoogleController.register);
router.post("/update", checkAuth, accGoogleController.update);

// callback route of OAuth
/* router.get("/google/redirect", passport.authenticate('google', {
    failureRedirect: "/"
})); */

module.exports = router;