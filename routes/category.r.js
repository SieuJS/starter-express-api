const express = require("express");
const router = express.Router();
const categoryC = require("../controllers/category.c");
const checkAuth = require("../middlewares/check-auth.js");
const checkRole = require('../middlewares/check-role')

router.get("/", categoryC.getAllCat);
router.get("/get-by-page", categoryC.getByPage);
router.post("/add", checkAuth, checkRole, categoryC.addCategory);
router.get("/delete", checkAuth, checkRole, categoryC.deleteCategory);
router.post("/update", checkAuth, checkRole, categoryC.updateCategory);

module.exports = router;