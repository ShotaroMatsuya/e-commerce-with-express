// const mongodb = require('mongodb');
const Product = require('../models/product');

// const ObjectId = mongodb.ObjectId;//mongoDBでidを使用する場合はコンストラクターの引数にセットする必要がある

exports.getAddProduct = (req,res,next)=>{ //第一引数には相対パスをセットできる(optional)
    // res.sendFile(path.join(rootDir,'views','add-product.html'));
    res.render('admin/edit-product',{
        pageTitle:'Add Product',
        path:'/admin/add-product',
        editing:false,
        isAuthenticated:req.session.isLoggedIn
    });
    };
exports.postAddProduct =(req,res,next)=>{
    // console.log(req.body);//フォームからの入力値をparseするにはbody-parserが必要
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    const product = new Product({
      title:title,
      price:price,
      description:description,
      imageUrl:imageUrl,
      userId:req.session.user //mongooseはuserモデルインスタンスをそのままセットするとidのみをextractしてくれる
    });
    // const product = new Product(
    //   title,
    //   price,
    //   description,
    //   imageUrl,
    //   null,
    //   req.user._id//ここはstring型になっている(かんたんにrelationを追加できるのがNoSQLの強み)
    //   );
    product.save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    });
};
exports.getEditProduct = (req,res,next)=>{ 
    const editMode = req.query.edit;//ここで渡るtrueはstring型になる点に注意
    if(!editMode){
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
        isAuthenticated:req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};
exports.postEditProduct = (req,res,next)=>{
    const prodId = req.body.productId;
    
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDesc = req.body.description;
    Product.findById(prodId).then(product=>{
      product.title =updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.imageUrl = updatedImageUrl;
      return product.save();
    }).then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
    // const product = new Product(
    //   updatedTitle,
    //   updatedPrice,
    //   updatedDesc,
    //   updatedImageUrl,
    //   prodId
    //   );

}
exports.getProducts = (req,res,next)=>{
    Product.find()
    // .select('title price - _id')//抽出するProductモデルのフィールドを指定(titleとpriceを取得しidを除くという意味)
    // .populate('userId','name')//productモデルのuserIdからuserモデルを抽出し、さらにuserモデルのnameのみを抽出するという意味
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated:req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
}
exports.postDeleteProduct =(req,res,next)=>{
    const prodId = req.body.productId;
    Product.findByIdAndRemove(prodId)
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    }).catch(err => console.log(err));
}