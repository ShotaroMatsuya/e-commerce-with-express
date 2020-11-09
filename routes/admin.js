const path = require('path');//core-moduleなのでinstallする必要はない


const express = require('express');
const rootDir = require('../util/path');//root-pathが格納されている

const router = express.Router();

//routerメソッドはappメソッドと似たような働き
router.get('/add-product',(req,res,next)=>{ //第一引数には相対パスをセットできる(optional)
    res.sendFile(path.join(rootDir,'views','add-product.html'));

});
router.post('/add-product',(req,res,next)=>{
    console.log(req.body);//フォームからの入力値をparseするにはbody-parserが必要
    res.redirect('/');
});

module.exports = router;