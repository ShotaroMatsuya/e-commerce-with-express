const path = require('path');//core-moduleなのでinstallする必要はない

const express = require('express');
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

//routerメソッドはappメソッドと似たような働き
router.get('/add-product',isAuth,adminController.getAddProduct);//middlewareは左から右へ順に実行される

router.get('/products',isAuth,adminController.getProducts);

router.post('/add-product',isAuth,adminController.postAddProduct);

router.get('/edit-product/:productId',isAuth,adminController.getEditProduct);
router.post('/edit-product',isAuth,adminController.postEditProduct);
router.post('/delete-product',isAuth,adminController.postDeleteProduct);
// nameを指定しないexports
module.exports = router;

// nameを指定するexports
// exports.routes = router;
// exports.products = products;