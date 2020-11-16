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

//urlクエリパラメータからidを取得する
router.get('/products/:productId',shopController.getProduct);



router.get('/cart',shopController.getCart);
router.post('/cart',shopController.postCart);
router.post('/cart-delete-item',shopController.postCartDeleteProduct);

router.post('/create-order', shopController.postOrder);

router.get('/orders', shopController.getOrders);

// router.get('/checkout',shopController.getCheckout);

module.exports = router;
