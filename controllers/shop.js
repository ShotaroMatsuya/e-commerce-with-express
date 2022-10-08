const fs = require('fs');
const path = require('path');

const config = require('./config');

const PDFDocument = require('pdfkit');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

AWS.config.update({
  aws_access_key_id: process.env.AWS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-northeast-1',
});

const Product = require('../models/product');
const Order = require('../models/order');

let ITEMS_PER_PAGE = 3;

exports.getProducts = (req, res, next) => {
  //middlewareをセット(すべてのリクエストに適用される)
  // const products =Product.fetchAll();
  //fetchAllの引数にコールバックを渡すことでviewにundefinedなデータを渡すことを防ぐ

  const page = +req.query.page || 1; //string型なのでnumber型にする必要がある
  let totalItems;
  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE) //飛ばす範囲(offsetのこと)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        //paginationLinkに必要なprops
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        category: 'all',
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId) //mongooseのfindByIdメソッドはstringを自動的にObjectIdオブジェクトに変換してくれる
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1; //string型なのでnumber型にする必要がある
  const totalItems = 4;
  ITEMS_PER_PAGE = 4;
  Product.find()
    .countDocuments()
    .then(numProducts => {
      return Product.aggregate()
        .sample(4)
        .skip((page - 1) * ITEMS_PER_PAGE) //飛ばす範囲(offsetのこと)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        //paginationLinkに必要なprops
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getCategory = (req, res, next) => {
  const category = req.params.category;

  const page = +req.query.page || 1; //string型なのでnumber型にする必要がある
  let totalItems;
  Product.find({ categories: { $in: [category] } })
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find({ categories: { $in: [category] } })
        .skip((page - 1) * ITEMS_PER_PAGE) //飛ばす範囲(offsetのこと)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/category', {
        prods: products,
        pageTitle: category,
        path: '/products',
        //paginationLinkに必要なprops
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        category: category,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getCart = (req, res, next) => {
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
    .populate('cart.items.productId') //userモデルのcartフィールド内のproductIdからproductモデルを取得
    .execPopulate() //promiseオブジェクトにするために必要
    .then(user => {
      // console.log(user.cart.items);
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
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
};
exports.postCartDeleteProduct = (req, res, next) => {
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
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate('cart.items.productId') //userモデルのcartフィールド内のproductIdからproductモデルを取得
    .execPopulate() //promiseオブジェクトにするために必要
    .then(user => {
      // console.log(user.cart.items);
      products = user.cart.items;
      total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });
      return config.stripe.checkout.sessions.create({
        payment_method_types: ['card'], //credit card payment
        line_items: products.map(p => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: Math.floor(p.productId.price * 1.1),
            currency: 'jpy',
            quantity: p.quantity,
          };
        }),
        success_url:
          req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
      });
    })
    .then(session => {
      res.render('shop/checkout', {
        path: '/cart',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId') //userモデルのcartフィールド内のproductIdからproductモデルを取得
    .execPopulate() //promiseオブジェクトにするために必要
    .then(user => {
      // console.log(user.cart.items);
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } }; //このproductIdはproduct情報がすべて格納されたオブジェクト,_docとすることで内包されたデータがconsole上で読めるようになる
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      return res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId') //userモデルのcartフィールド内のproductIdからproductモデルを取得
    .execPopulate() //promiseオブジェクトにするために必要
    .then(user => {
      // console.log(user.cart.items);
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } }; //このproductIdはproduct情報がすべて格納されたオブジェクト,_docとすることで内包されたデータがconsole上で読めるようになる
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      return res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch(err => console.log(err));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(Error('No order Found.'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath =
        process.env.NODE_ENV === 'develop'
          ? path.join('data', 'invoices', invoiceName)
          : '/tmp/' + invoiceName;
      const userName = order.populate('user.userId').user.email;

      const pdfDoc = new PDFDocument();
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader(
      //   'Content-Disposition',
      //   'inline; filename="' + invoiceName + '"'
      // );
      let file = fs.createWriteStream(invoicePath);
      pdfDoc.pipe(file);
      // pdfDoc.pipe(res);

      pdfDoc.fontSize(30);

      pdfDoc
        .font(__dirname + '/../fonts/mplus-1p-regular.ttf')
        .text('請求書', 50, 10);
      pdfDoc.text('請求書', 50, 10);

      pdfDoc.rect(170, 30, 380, 5).lineWidth(5).stroke('#b4b4b4');

      pdfDoc.fontSize(15);
      pdfDoc.fillColor('black');

      pdfDoc.text(userName + '　様', 50, 80);

      pdfDoc.rect(60, 147, 230, 20).lineWidth(20).stroke('#b4b4b4');

      pdfDoc.fontSize(10).text('下記の通りご請求申し上げます', 50, 120);

      pdfDoc.fontSize(15);

      pdfDoc.text('ご請求金額', 50, 150);

      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
      });
      pdfDoc.text(totalPrice + '円', 200, 150);
      pdfDoc.rect(50, 200, 500, 500).lineWidth(1).stroke('#b4b4b4');

      pdfDoc.fontSize(10);

      pdfDoc.text('品番・品名', 51, 210).stroke();

      pdfDoc.text('単価', 251, 210).stroke();

      pdfDoc.text('数量', 351, 210).stroke();

      pdfDoc.text('金額', 451, 210).stroke();

      pdfDoc.moveTo(50, 230).lineTo(550, 230).stroke('#b4b4b4');

      let x = 50;
      let y = 240;
      order.products.forEach(prod => {
        let proTitle = prod.product.title;
        let proPrice = prod.product.price;
        let proQuant = prod.quantity;
        let proSum = prod.quantity * prod.product.price;

        pdfDoc.text(proTitle, x + 10, y).stroke();
        pdfDoc.text('¥' + proPrice, x + 210, y).stroke();
        pdfDoc.text(proQuant, x + 310, y).stroke();
        pdfDoc.text('¥' + proSum, x + 410, y).stroke();
        pdfDoc
          .moveTo(x, y + 20)
          .lineTo(x + 501, y + 20)
          .stroke('#b4b4b4');

        y += 30;
      });

      //Finalize PDF file
      pdfDoc.end();

      // pdfDoc.fontSize(26);
      // pdfDoc.text('請求書', {
      //   underline: true,
      // });
      // pdfDoc.text('----------------------------');

      // pdfDoc.text('----');
      // pdfDoc.fontSize(20).text('合計金額: ￥ ' + totalPrice);

      // pdfDoc.end();

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
      file.on('finish', function () {
        //get the file size
        const stats = fs.statSync(invoicePath);
        console.log('filesize: ' + stats.size);

        console.log('starting s3 putObject');
        s3.putObject(
          {
            Bucket: process.env.MY_BUCKET,
            Key: 'invoices/' + invoiceName,
            Body: fs.createReadStream(invoicePath),
            ContentType: 'application/pdf',
            ContentLength: stats.size,
            ACL: 'public-read',
          },
          function (err) {
            if (err) {
              console.log(err, err.stack);
              next(err);
            } else {
              console.log('Done');
              res.statusCode = 302;
              res.setHeader(
                'location',
                'https://' +
                  process.env.MY_BUCKET +
                  '.s3.ap-northeast-1.amazonaws.com/invoices/' +
                  invoiceName
              );
              return res.end();
            }
          }
        );
      });
    })
    .catch(err => next(err));
};
