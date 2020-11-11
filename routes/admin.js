const path = require('path');//core-moduleなのでinstallする必要はない


const express = require('express');
const adminController = require('../controllers/admin');

const router = express.Router();

//routerメソッドはappメソッドと似たような働き
router.get('/add-product',adminController.getAddProduct);

router.get('/products',adminController.getProducts);

router.post('/add-product',adminController.postAddProduct);
// nameを指定しないexports
module.exports = router;

// nameを指定するexports
// exports.routes = router;
// exports.products = products;