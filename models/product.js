// with JSON

// const path = require('path');

// const Cart = require('./cart');

// const p = path.join(
//   path.dirname(process.mainModule.filename),
//   'data',
//   'products.json'
// );

// const getProductsFromFile = cb =>{//readFileが終了したあとに実行したい関数を引数にセットする
//         //reaFileはasynchronousな関数なのでコールバック関数は直ちに実行されず、undefinedを返してしまっている
//         fs.readFile(p,(err,fileContent)=>{
//             if(err){
//                 // return [];
//                 cb([]);
//             }else{
//                 // return JSON.parse(fileContent);
//                 cb(JSON.parse(fileContent));
//             }
//         });
// }

// module.exports = class Product{
//     constructor(id,title,imageUrl,description,price){
//         this.id = id;
//         this.title = title;
//         this.imageUrl = imageUrl;
//         this.description = description;
//         this.price = price;

//     }
//     save(){
        
//         getProductsFromFile(products=>{
//             if(this.id){//すでにidが存在している場合(updateしたいとき)
//                 const existingProductIndex = products.findIndex(prod =>{
//                     return prod.id === this.id; 
//                 });
//                 const updatedProducts = [...products];
//                 updatedProducts[existingProductIndex] = this;
//                 fs.writeFile(p,JSON.stringify(updatedProducts),err=>{
//                     console.log(err);
//                 });//javascriptオブジェクトをjsonフォーマットに変換
//             }else{//新しい商品を追加する場合
//                 this.id = Math.random().toString();
//                 products.push(this);
//                 fs.writeFile(p,JSON.stringify(products),(err)=>{
//                     console.log(err);
//                 });//javascriptオブジェクトをjsonフォーマットに変換

//             }
//         });
//     }

//     //fetchしたあとに実行したい処理をコールバック関数で受け取る
//     static fetchAll(cb){
//         getProductsFromFile(cb);
//     }
//     //fetchしたあとに実行したい処理をコールバック関数で受け取る

//     static deleteById(id) {
//         //findは一つの値のみ返すが、filterは複数の値を配列で返す
//         getProductsFromFile(products => {
//           const product = products.find(prod => prod.id == id);
//           const updatedProducts = products.filter(prod => prod.id != id);

//           fs.writeFile(p, JSON.stringify(updatedProducts), err => {
//             if (!err) {
//               Cart.deleteProduct(id, product.price);
//             }
//           });
//         });
//       }
//     static findById(id,cb){
//         getProductsFromFile(products=>{
//             const product = products.find(p=> p.id === id);
//             cb(product);
//         })
//     }

// }
const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;
class Product{
  constructor(title,price,description,imageUrl,id,userId){
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id ? new mongodb.ObjectId(id) : null;//MongoDBでidを使用するにはidを特殊なオブジェクトに変換する必要がある
    this.userId = userId;
  }
  save(){
    const db = getDb();
    let dbOp;
    if(this._id){
      //update the product
      dbOp = db.collection('products')
      .updateOne({_id: this._id},{$set:this});//上書きするには$setを使う
    }else{
      dbOp = db.collection('products').insertOne(this);//新しく追加
    }
    return dbOp
    .then(result=>{
      console.log(result);
    })
    .catch(err=>{
      console.log(err);
    });
  }
  static fetchAll(){
    const db = getDb();
    return db.collection('products')
      .find()
      .toArray()
      .then(products=>{
        console.log(products);
        return products;
      })
      .catch(err=>{
      console.log(err);
    });//全てのproductsを取得
  }
  static findById(prodId){
    const db = getDb();
    return db.collection('products')
      // .find({_id:prodId}) //_idは特殊なオブジェクトになっている。string型を変換する必要がある
      .find({_id:new mongodb.ObjectId(prodId)})
      .next() //もし複数あったら最後の1件を抽出
      .then(product=>{
        return product;
      })
      .catch(err=>{
      console.log(err);
    });
  }
  static deleteById(prodId){
    const db = getDb();
    return db.collection('products')
      .deleteOne({_id:new mongodb.ObjectId(prodId)})
      .then(result=>{
        console.log('Deleted');
      })
      .catch(err =>{
        console.log(err);
      });
  }
}


module.exports = Product;
