const path = require('path');
const express = require('express');

const shopController = require('../controllers/shop');

const router = express.Router();


router.get('/',shopController.getIndex
    // res.render(path.join(rootDir,'views','shop.html'));

    //sendFIleは自動でheaderをセットしてくれるメソッド
    //path.joinでabsoluteパスをセットする必要がある
    //Linuxでもwindowsでも機能する正しいpathに変換してくれる
);
router.get('/products',shopController.getProducts);

router.get('/cart',shopController.getCart);
router.get('/orders',shopController.getOrders);

router.get('/checkout',shopController.getCheckout);

module.exports = router;
