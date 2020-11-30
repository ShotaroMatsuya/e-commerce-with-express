const path = require('path');
const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const router = express.Router();


router.get('/',shopController.getIndex
    // res.render(path.join(rootDir,'views','shop.html'));

    //sendFIleは自動でheaderをセットしてくれるメソッド
    //path.joinでabsoluteパスをセットする必要がある
    //Linuxでもwindowsでも機能する正しいpathに変換してくれる
);
router.get('/products',shopController.getProducts);

//urlクエリパラメータからidを取得する
router.get('/products/:productId',shopController.getProduct);



router.get('/cart',isAuth,shopController.getCart);
router.post('/cart',isAuth,shopController.postCart);
router.post('/cart-delete-item',isAuth,shopController.postCartDeleteProduct);

router.get('/checkout',isAuth,shopController.getCheckout);

router.get('/checkout/success',shopController.getCheckoutSuccess);
router.get('/checkout/cancel',shopController.getCheckout);


router.get('/orders',isAuth, shopController.getOrders);

router.get('/orders/:orderId',isAuth,shopController.getInvoice);

module.exports = router;
