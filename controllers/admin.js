// const mongodb = require('mongodb');
const Product = require('../models/product');

const fileHelper = require('../util/file');

const { validationResult } = require('express-validator/check');
// const ObjectId = mongodb.ObjectId;//mongoDBでidを使用する場合はコンストラクターの引数にセットする必要がある

exports.getAddProduct = (req, res, next) => {
  //第一引数には相対パスをセットできる(optional)
  // res.sendFile(path.join(rootDir,'views','add-product.html'));
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};
exports.postAddProduct = (req, res, next) => {
  // console.log(req.body);//フォームからの入力値をparseするにはbody-parserが必要
  const title = req.body.title;
  const image = req.file;
  console.log(image);
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      product: {
        title: title,
        price: price,
        description: description,
      },
      hasError: true,
      errorMessage: 'Attached file is not an image.',
      validationErrors: [],
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      product: {
        title: title,
        price: price,
        description: description,
      },
      hasError: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  // const imageUrl = image.path;
  const imageUrl = image.key;

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user, //mongooseはuserモデルインスタンスをそのままセットするとidのみをextractしてくれる
  });
  // const product = new Product(
  //   title,
  //   price,
  //   description,
  //   imageUrl,
  //   null,
  //   req.user._id//ここはstring型になっている(かんたんにrelationを追加できるのがNoSQLの強み)
  //   );
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      // return res.status(500).render('admin/edit-product',{
      //   pageTitle:'Add Product',
      //   path:'/admin/add-product',
      //   editing:false,
      //   product:{
      //     title:title,
      //     imageUrl:imageUrl,
      //     price:price,
      //     description:description
      //   },
      //   hasError:true,
      //   errorMessage:'Database operation failed, please try again.',
      //   validationErrors:[]
      // });

      // res.redirect('/500');

      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); //nextにerrorが渡されるとexpressによってすべてのmiddlewareをスキップしてerrorMiddlewareを実行してくれる
    });
};
exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit; //ここで渡るtrueはstring型になる点に注意
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;

  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
      hasError: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        //product作成者以外は編集できないようにする
        return res.redirect('/');
      }

      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (image) {
        fileHelper.deleteFile(product.imageUrl); //既存のファイルを削除
        product.imageUrl = image.key;
      }
      return product.save().then(result => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id }) //adminでは自分が作成したproductsのみを表示
    // .select('title price - _id')//抽出するProductモデルのフィールドを指定(titleとpriceを取得しidを除くという意味)
    // .populate('userId','name')//productモデルのuserIdからuserモデルを抽出し、さらにuserモデルのnameのみを抽出するという意味
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return next(new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.imageUrl); //既存のファイルを削除
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({ message: 'Success!' });
    })
    .catch(err => {
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error);
      res.status(500).json({ message: 'Deleting product failed.' });
    });
};
