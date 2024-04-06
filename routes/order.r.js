const express = require("express")
const router = express.Router();
const orderC = require('../controllers/order.c')
const checkAuth = require("../middlewares/check-auth")

router.post('/placeorder',checkAuth, orderC.placeOrder);
router.get("", checkAuth, orderC.getOrdersHandler)
router.get("/:orderId/getdetail", orderC.getDetail)

module.exports = router