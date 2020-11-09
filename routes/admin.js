const path = require('path');//core-moduleなのでinstallする必要はない


const express = require('express');
const productsController = require('../controllers/products');

const router = express.Router();

//routerメソッドはappメソッドと似たような働き
router.get('/add-product',productsController.getAddProduct);
router.post('/add-product',productsController.postAddProduct);
// nameを指定しないexports
module.exports = router;

// nameを指定するexports
// exports.routes = router;
// exports.products = products;