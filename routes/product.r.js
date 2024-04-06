const express = require("express");
const router = express.Router();
const multer = require('multer');
const productC = require("../controllers/product.c");

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './public/images');
//     },
//     filename(req, file, cb){
//         cb(null, file.originalname)
//     }
// });

// const upload = multer({storage})

const checkAuth = require("../middlewares/check-auth.js");
const checkRole = require('../middlewares/check-role')

router.get("/delete" , checkAuth, checkRole, productC.delete);
router.get("/get-by-cat/:catID", productC.getProductByCat);
router.get("/get-by-page", productC.getProductByPage);
router.get("/:proid", productC.getById);
router.get("/get-by-pro/:proID", productC.getProductByProID);
router.get("/sameproduct/:proid", productC.getSameProduct);
// router.post("/add", upload.single('proImage'), productC.addProduct);
// router.post("/update", upload.single('proImage'), productC.updateProduct);
router.post("/add", checkAuth, checkRole, productC.addProduct);
router.post("/update", checkAuth, checkRole, productC.updateProduct);

module.exports = router;