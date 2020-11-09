const path = require('path');
const express = require('express');
const rootDir = require('../util/path');//root-pathが格納されている


const router = express.Router();


router.get('/',(req,res,next)=>{//middlewareをセット(すべてのリクエストに適用される)
    res.sendFile(path.join(rootDir,'views','shop.html'));
    //sendFIleは自動でheaderをセットしてくれるメソッド
    //path.joinでabsoluteパスをセットする必要がある
    //Linuxでもwindowsでも機能する正しいpathに変換してくれる
});

module.exports = router;
