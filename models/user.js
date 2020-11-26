const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const userSchema = new Schema({
  email:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  resetToken:String,
  resetTokenExpiration:Date,
  cart:{
    items:[
      {
        productId:{
          type:Schema.Types.ObjectId,
          ref:'Product',//Productモデルのidを参照する
          required:true
        },
        quantity:{type:Number,required:true}
      }
    ]
  }
});
userSchema.methods.addToCart = function(product){//カスタム関数の追加
  const cartProductIndex = this.cart.items.findIndex(cp=>{
      return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    if(cartProductIndex >= 0){//もしカートに同じ商品が存在したら
      newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;//個数のみを更新
    }else{//新しく追加する場合は
      updatedCartItems.push({
        productId:product._id,
        quantity:newQuantity
      })
    }
    const updatedCart = {
      items:updatedCartItems
    };
    this.cart = updatedCart;
    return this.save();
}
userSchema.methods.removeFromCart = function(productId){
  const updatedCartItems = this.cart.items.filter(item=>{
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
}
userSchema.methods.clearCart = function(){
  this.cart = {item:[]};
  return this.save();
}
module.exports = mongoose.model('User',userSchema);
// const mongodb = require('mongodb');
// const getDb  = require('../util/database').getDb;

// const ObjectId = mongodb.ObjectId;

// class User{
//   constructor(username,email,cart,id){
//     this.name = username;
//     this.email = email;
//     this.cart = cart;//{items:[]}
//     this._id = id;
//   }
//   save(){
//     const db = getDb();
//     return db.collection('users').insertOne(this);
//   }
//   addToCart(product){
//     const cartProductIndex = this.cart.items.findIndex(cp=>{
//       return cp.productId.toString() === product._id.toString();
//     });
//     let newQuantity = 1;
//     const updatedCartItems = [...this.cart.items];
//     if(cartProductIndex >= 0){//もしカートに同じ商品が存在したら
//       newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//       updatedCartItems[cartProductIndex].quantity = newQuantity;//個数のみを更新
//     }else{//新しく追加する場合は
//       updatedCartItems.push({productId:new ObjectId(product._id),quantity:newQuantity})
//     }
//     const updatedCart = {
//       items:updatedCartItems
//     };
//     const db = getDb();
//     return db.collection('users')
//       .updateOne(
//       {_id:new ObjectId(this._id)},
//       {$set:{cart:updatedCart}});

//   }
//   getCart(){
//     const db = getDb();
//     const productIds = this.cart.items.map(i=>{//カートに入ったproductIdを配列で取得
//       return i.productId;
//     });
//     return db.collection('products')
//       .find({_id:{$in:productIds}}) //$inに配列をセットすると配列の要素と一致するproductIdをまとめて取得(orの働き)
//       .toArray()
//       .then(products=>{//productsは配列(id以外の情報も入っている)
//         return products.map(p=>{
//           return{
//             ...p,
//             quantity:this.cart.items.find(i =>{
//               return i.productId.toString() === p._id.toString();
//             }).quantity
//           };
//         });
//       });
//   }
//   deleteItemFromCart(productId){
//     const updatedCartItems = this.cart.items.filter(item=>{
//       return item.productId.toString() !== productId.toString();
//     });
//     const db = getDb();
//     return db.collection('users')
//       .updateOne(
//         {_id:new ObjectId(this._id)},
//         {$set:{cart:{items:updatedCartItems}}}//$setで指定したフィールドのみが更新される
//       );
//   }
//   addOrder(){
//     const db = getDb();
//     return this.getCart()
//       .then(products =>{//[{...productオブジェクト,quantity:x},{...}]
//       const order = {
//         items:products,
//         user:{
//           _id:new ObjectId(this._id),
//           name:this.name,
//         }
//       };
//       return db.collection('orders').insertOne(order);
//     }).then(result=>{
//       this.cart = {items:[]};//ordersに追加したあとはcartを空に
//       return db.collection('users').updateOne(
//         {_id: new ObjectId(this._id)},
//         {$set:{cart:{items:[]}}}//ordersに追加したあとはcartを空に
//       );
//     });
//   }
//   getOrders(){
//     const db = getDb();
//     return db.collection('orders')
//       .find({'user._id':new ObjectId(this._id)})
//       .toArray();
//   }
//   static findById(userId){
//     const db = getDb();
//     return db.collection('users')
//       .findOne({_id:new ObjectId(userId)})//find().next()の代わり
//       .then(user=>{
//         console.log(user);
//         return user;
//       })
//       .catch(err=>{
//         console.log(err);
//       });
//   }
// }

// module.exports = User;
