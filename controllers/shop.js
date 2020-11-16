const Product = require('../models/product');




exports.getProducts = (req,res,next)=>{
    //middlewareをセット(すべてのリクエストに適用される)
    // const products =Product.fetchAll();
    //fetchAllの引数にコールバックを渡すことでviewにundefinedなデータを渡すことを防ぐ
    Product.fetchAll()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => {
      console.log(err);
    });
};
exports.getProduct = (req,res,next)=>{
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
}
exports.getIndex = (req,res,next)=>{
    Product.fetchAll()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => {
      console.log(err);
    });
}
exports.getCart =(req,res,next)=>{
    // Cart.getCart(cart=>{//cartはオブジェクト
    //     Product.fetchAll(products =>{//productsはarray
    //         const cartProducts =[];//productオブジェクトに変更
    //         for(product of products){
    //             const cartProductData = cart.products.find(prod => prod.id === product.id);//個数はcartモデルの方から取得する必要がある
    //             if(cartProductData){
    //                 cartProducts.push({productData:product,qty:cartProductData.qty});
    //             }//cartProductsはarray
    //         }
    //         res.render('shop/cart',{
    //             path:'/cart',
    //             pageTitle:'Your Cart',
    //             products:cartProducts
    //         });

    //     });

    // });
    req.user
    .getCart()
    .then(products => {//[{productモデル,quantity:~~}]
      res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products
          });
        })
        .catch(err => console.log(err));
};
exports.postCart =(req,res,next)=>{
    const prodId = req.body.productId;
    Product.findById(prodId).then(product=>{
      return req.user.addToCart(product);
    }).then(result =>{
      console.log(result);
      res.redirect('/cart');
    });
  // let fetchedCart;
  // let newQuantity = 1;
  // req.user
  //   .getCart()
  //   .then(cart => {
  //     fetchedCart = cart;
  //     return cart.getProducts({ where: { id: prodId } });
  //   })
  //   .then(products => {
  //     let product;
  //     if (products.length > 0) {
  //       product = products[0];
  //     }

  //     if (product) {
  //       const oldQuantity = product.cartItem.quantity;
  //       newQuantity = oldQuantity + 1;
  //       return product;
  //     }
  //     return Product.findById(prodId);
  //   })
  //   .then(product => {
  //     return fetchedCart.addProduct(product, {
  //       through: { quantity: newQuantity }
  //     });
  //   })
  //   .then(() => {
  //     res.redirect('/cart');
  //   })
  //   .catch(err => console.log(err));
}
exports.postCartDeleteProduct = (req,res,next)=>{
    const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));

}
exports.postOrder = (req, res, next) => {
    let fetchedCart;
    req.user
      .addOrder().then(result=>{
        res.redirect('/orders');
      }).catch(err => console.log(err));

  };
  
  exports.getOrders = (req, res, next) => {
    req.user
      .getOrders()
      .then(orders => {
        res.render('shop/orders', {
          path: '/orders',
          pageTitle: 'Your Orders',
          orders: orders
        });
      })
      .catch(err => console.log(err));
  };
  
exports.getCheckout = (req,res,next)=>{
    res.render('shop/checkout',{
        path:'/checkout',
        pageTitle:'Checkout'
    })
}