const express = require("express");
const router = express.Router();
const googlePath = require("./auth/auth-google.r.js")
const accC = require("../controllers/acc.c.js");

const checkAuth = require("../middlewares/check-auth.js");
const checkRole = require('../middlewares/check-role')
//router.use(checkAuth);
const {check} = require('express-validator')

router.use("/google", googlePath);
router.get("/:userId", accC.getUserById);
router.get("/check/:username", accC.checkUsername);
router.post("/checkpassword", checkAuth, accC.checkPassword);
router.post("/register",[
    check('name').isLength({min : 6}),
    check("username").isLength({min:6}),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({min:6}),
    check('dob').not().isEmpty(),
    check('role').not().isEmpty()
], accC.signUpHandler);
router.post("/login",[
    check("username").isLength({min:6}),
    check('password').isLength({min:6}),
],
 accC.logInHandler);
router.post("/update", checkAuth, accC.updateHandler);
router.post("/delete", accC.deleteHandler);
router.get("/:userId", accC.getUserById);
router.get("/orders", checkAuth, accC.getOrders);

// ducthinh update
router.post("/ban", checkAuth, checkRole, accC.banAcc);
router.get("/get-balance/:userId", checkAuth, accC.getBalance);

router.post("/registerAdmin", checkAuth, checkRole, [
    check("accountName").isLength({min:1}),
    check('accountUser').isLength({ min: 1 }),
    check('accountDOB').not().isEmpty(),
    check('accountEmail').normalizeEmail().isEmail(),
    check('accountPass').isLength({min:6}),
], accC.signUpAdminHandler);

router.post("/updateAdmin", checkAuth, checkRole, [
    check("Name").isLength({min:1}),
    check('Email').normalizeEmail().isEmail(),
    check('DOB').not().isEmpty()
], accC.updateAdminHandler);

module.exports = router;