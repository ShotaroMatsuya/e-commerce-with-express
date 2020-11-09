const Product = require('../models/product');

exports.getAddProduct = (req,res,next)=>{ //第一引数には相対パスをセットできる(optional)
// res.sendFile(path.join(rootDir,'views','add-product.html'));
res.render('add-product',{
    pageTitle:'Add Product',
    path:'/admin/add-product',
    formsCSS:true,
    productCSS:true,
    activeAddProduct:true
});
};
exports.postAddProduct =(req,res,next)=>{
    // console.log(req.body);//フォームからの入力値をparseするにはbody-parserが必要
    const product = new Product(req.body.title);
    product.save();
    res.redirect('/');
};

exports.getProducts = (req,res,next)=>{//middlewareをセット(すべてのリクエストに適用される)
    const products =Product.fetchAll();
    res.render('shop', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        hasProducts: products.length > 0,
        activeShop: true,
        productCSS: true
    });
};