const path = require('path');
const express = require('express');

const productsController = require('../controllers/products');

const router = express.Router();


router.get('/',productsController.getProducts
    // res.render(path.join(rootDir,'views','shop.html'));

    //sendFIleは自動でheaderをセットしてくれるメソッド
    //path.joinでabsoluteパスをセットする必要がある
    //Linuxでもwindowsでも機能する正しいpathに変換してくれる
);

module.exports = router;
