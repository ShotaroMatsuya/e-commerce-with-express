const path = require('path');//core-moduleなのでinstallする必要はない


const express = require('express');
const adminController = require('../controllers/admin');

const router = express.Router();

//routerメソッドはappメソッドと似たような働き
router.get('/add-product',adminController.getAddProduct);

router.get('/products',adminController.getProducts);

router.post('/add-product',adminController.postAddProduct);

router.get('/edit-product/:productId',adminController.getEditProduct);
router.post('/edit-product',adminController.postEditProduct);
router.post('/delete-product',adminController.postDeleteProduct);
// nameを指定しないexports
module.exports = router;

// nameを指定するexports
// exports.routes = router;
// exports.products = products;