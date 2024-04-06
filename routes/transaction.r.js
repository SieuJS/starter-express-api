const express = require("express")
const router = express.Router();
const tranC = require('../controllers/transaction.c')
const checkAuth = require("../middlewares/check-auth")

router.get("", checkAuth, tranC.getTransactions);

module.exports = router