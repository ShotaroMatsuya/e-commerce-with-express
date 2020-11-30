const fs = require('fs');
const path = require('path');
const stripe = require('stripe')('sk******');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 3;

exports.getProducts = (req,res,next)=>{
    //middlewareをセット(すべてのリクエストに適用される)
    // const products =Product.fetchAll();
    //fetchAllの引数にコールバックを渡すことでviewにundefinedなデータを渡すことを防ぐ

    const page = +req.query.page || 1 ;//string型なのでnumber型にする必要がある
  let totalItems;
  Product
    .find()
    .countDocuments()
    .then(numProducts =>{
      totalItems = numProducts;
      return Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE) //飛ばす範囲(offsetのこと)
      .limit(ITEMS_PER_PAGE);
    }).then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        //paginationLinkに必要なprops
        currentPage:page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage : page > 1,
        nextPage: page + 1,
        previousPage:page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getProduct = (req,res,next)=>{
    const prodId = req.params.productId;
    Product.findById(prodId)//mongooseのfindByIdメソッドはstringを自動的にObjectIdオブジェクトに変換してくれる
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}
exports.getIndex = (req,res,next)=>{
  const page = +req.query.page || 1 ;//string型なのでnumber型にする必要がある
  let totalItems;
  Product
    .find()
    .countDocuments()
    .then(numProducts =>{
      totalItems = numProducts;
      return Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE) //飛ばす範囲(offsetのこと)
      .limit(ITEMS_PER_PAGE);
    }).then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        //paginationLinkに必要なprops
        currentPage:page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage : page > 1,
        nextPage: page + 1,
        previousPage:page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
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
    .populate('cart.items.productId')//userモデルのcartフィールド内のproductIdからproductモデルを取得
    .execPopulate()//promiseオブジェクトにするために必要
    .then(user => {
      // console.log(user.cart.items);
      const products = user.cart.items;
      res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products
          });
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
};
exports.postCart =(req,res,next)=>{
    const prodId = req.body.productId;
    Product.findById(prodId).then(product=>{
      return req.user.addToCart(product);
    }).then(result =>{
      console.log(result);
      res.redirect('/cart');
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });;
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
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

}

exports.getCheckout = (req,res,next) =>{
  let products;
  let total = 0;
  req.user
    .populate('cart.items.productId')//userモデルのcartフィールド内のproductIdからproductモデルを取得
    .execPopulate()//promiseオブジェクトにするために必要
    .then(user => {
      // console.log(user.cart.items);
      const products = user.cart.items;
      let total = 0;
      products.forEach(p =>{
        total += p.quantity * p.productId.price;
      });
      return stripe.checkout.session.create({
        payment_method_types:['card'],
        line_items:products.map(p=>{
          return {
            name:p.productId.title,
            description:p.productId.description,
            amount:p.productId.price * 100,
            currency:'usd',
            quantity:p.quantity
          };
        }),
        success_url:req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url:req.protocol + '://' + req.get('host') + '/checkout/cancel'
      });
    }).then(session=>{
      res.render('shop/checkout', {
        path: '/cart',
        pageTitle: 'Checkout',
        products: products,
        totalSum:total,
        sessionId:session.id
      });
    })
    .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
}

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')//userモデルのcartフィールド内のproductIdからproductモデルを取得
    .execPopulate()//promiseオブジェクトにするために必要
    .then(user => {
      // console.log(user.cart.items);
      const products = user.cart.items.map(i=>{
        return {quantity:i.quantity,product:{...i.productId._doc}};//このproductIdはproduct情報がすべて格納されたオブジェクト,_docとすることで内包されたデータがconsole上で読めるようになる
      });
      const order = new Order({
        user:{
          email:req.user.email,
          userId:req.user
        },
        products:products
      });
      return order.save();
    }).then(result=>{
      return req.user.clearCart();     
      })
      .then(()=>{
        return res.redirect('/orders');
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });

  };
  
  exports.getOrders = (req, res, next) => {
    Order.find({'user.userId':req.user._id})
      .then(orders => {
        res.render('shop/orders', {
          path: '/orders',
          pageTitle: 'Your Orders',
          orders: orders
        });
      })
      .catch(err => console.log(err));
  };
  

exports.getInvoice = (req,res,next) =>{
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order =>{
      if(!order){
        return next(Error('No order Found.'));
      }
      if(order.user.userId.toString() !== req.user._id.toString()){
        return next(new Error('Unauthorized'));
      }
      const invoiceName = 'invoice-'+ orderId + '.pdf';
      const invoicePath = path.join('data','invoices',invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type','application/pdf');
      res.setHeader('Content-Disposition','inline; filename="' + invoiceName + '"');
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text('Invoice',{
        underline:true
      });
      pdfDoc.text('----------------------------');
      let totalPrice = 0;
      order.products.forEach(prod =>{
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.fontSize(14).text(
          prod.product.title +
          ' - ' +
          prod.quantity +
          ' x ' +
          ' $ ' +
          prod.product.price
          );
      });
      pdfDoc.text('----');
      pdfDoc.fontSize(20).text('Total Price: $ ' + totalPrice);

      pdfDoc.end();
      // readFileはentire contentを読み込むまで待たないと行けない
    //   fs.readFile(invoicePath,(err,data) =>{
    //     if(err){
    //       return next(err);//err handle middlewareに渡す
    //     } 
    //     res.setHeader('Content-Type','application/pdf');
    //     // res.setHeader('Content-Disposition','inline');//ブラウザで表示
    //     res.setHeader('Content-Disposition','inline; filename="' + invoiceName + '"');
    //     res.send(data);
    // });
    //chunkごとに分割して読み込む(大容量ファイルの場合はこちらを使用するべき)
    // const file = fs.createReadStream(invoicePath);
    // res.setHeader('Content-Type','application/pdf');
    // res.setHeader('Content-Disposition','inline; filename="' + invoiceName + '"');
    // file.pipe(res);//resオブジェクトにstreamingしたchunkを押し渡す(nodeアプリケーションがキャッシュを保持する必要がなくなりperformanceの向上が見込める。browserが自分でconcatenateする)
  })
  .catch(err => next(err));
};