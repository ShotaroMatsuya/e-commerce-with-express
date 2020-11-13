const { fetchAll } = require('../models/product');
const Product = require('../models/product');
const Cart = require('../models/cart');



exports.getProducts = (req,res,next)=>{//middlewareをセット(すべてのリクエストに適用される)
    // const products =Product.fetchAll();
    //fetchAllの引数にコールバックを渡すことでviewにundefinedなデータを渡すことを防ぐ
    Product.fetchAll(products=>{
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'All Products',
            path: '/products'

        });

    });
};
exports.getProduct = (req,res,next)=>{
    const prodId = req.params.productId;
    Product.findById(prodId,product=>{
        res.render('shop/product-detail',{
            product: product,
            pageTitle:product.title,
            path:'/products'
        });
    });
}
exports.getIndex = (req,res,next)=>{
    Product.fetchAll(products=>{
        res.render('shop/index',{
            prods:products,
            pageTitle:'Shop',
            path:'/'
        });
    });
}
exports.getCart =(req,res,next)=>{
    Cart.getCart(cart=>{//cartはオブジェクト
        Product.fetchAll(products =>{//productsはarray
            const cartProducts =[];//productオブジェクトに変更
            for(product of products){
                const cartProductData = cart.products.find(prod => prod.id === product.id);//個数はcartモデルの方から取得する必要がある
                if(cartProductData){
                    cartProducts.push({productData:product,qty:cartProductData.qty});
                }//cartProductsはarray
            }
            res.render('shop/cart',{
                path:'/cart',
                pageTitle:'Your Cart',
                products:cartProducts
            });

        });

    });

}
exports.postCart =(req,res,next)=>{
    const prodId = req.body.productId;
    Product.findById(prodId,(product)=>{
        Cart.addProduct(prodId,product.price);
    });
    res.redirect('/cart');
}
exports.postCartDeleteProduct = (req,res,next)=>{
    const prodId = req.body.productId;
    Product.findById(prodId,product =>{
        Cart.deleteProduct(prodId,product.price);
        res.redirect('/cart');
    });

}
exports.getOrders =(req,res,next)=>{
    res.render('shop/orders',{
        path:'/orders',
        pageTitle:'Your Orders'
    });

}
exports.getCheckout = (req,res,next)=>{
    res.render('shop/checkout',{
        path:'/checkout',
        pageTitle:'Checkout'
    })
}