const Product = require('../models/product');

exports.getAddProduct = (req,res,next)=>{ //第一引数には相対パスをセットできる(optional)
    // res.sendFile(path.join(rootDir,'views','add-product.html'));
    res.render('admin/add-product',{
        pageTitle:'Add Product',
        path:'/admin/add-product',
        formsCSS:true,
        productCSS:true,
        activeAddProduct:true
    });
    };
    exports.postAddProduct =(req,res,next)=>{
        // console.log(req.body);//フォームからの入力値をparseするにはbody-parserが必要
        const title = req.body.title;
        const imageUrl = req.body.imageUrl;
        const price = req.body.price;
        const description = req.body.description;
        const product = new Product(title,imageUrl,description,price);
        product.save();
        res.redirect('/');
    };
    exports.getProducts = (req,res,next)=>{
        Product.fetchAll(products=>{
            res.render('admin/products',{
                prods:products,
                pageTitle:'Admin Products',
                path:'/admin/products'
            });
        });
    }