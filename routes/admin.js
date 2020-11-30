const path = require('path');//core-moduleなのでinstallする必要はない

const express = require('express');
const { body } = require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

//routerメソッドはappメソッドと似たような働き
router.get('/add-product',isAuth,adminController.getAddProduct);//middlewareは左から右へ順に実行される

router.get('/products',isAuth,adminController.getProducts);

router.post('/add-product',[
    body('title').isString().isLength({min:3}).trim(),
    // body('imageUrl').isURL(),
    body('price').isFloat(),
    body('description').isLength({min:5,max:400}).trim()

],
isAuth,adminController.postAddProduct);

router.get('/edit-product/:productId',isAuth,adminController.getEditProduct);
router.post('/edit-product',[
    body('title').isString().isLength({min:3}).trim(),
    // body('imageUrl').isURL(),
    body('price').isFloat(),
    body('description').isLength({min:5,max:400}).trim()

],isAuth,adminController.postEditProduct);
router.post('/delete-product',isAuth,adminController.postDeleteProduct);
// nameを指定しないexports
module.exports = router;

// nameを指定するexports
// exports.routes = router;
// exports.products = products;