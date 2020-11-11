const fs = require('fs');
const path = require('path');

const p = path.join(path.dirname(process.mainModule.filename),
    'data',
    'products.json'
    );
const getProductsFromFile = cb =>{//readFileが終了したあとに実行したい関数を引数にセットする
        //reaFileはasynchronousな関数なのでコールバック関数は直ちに実行されず、undefinedを返してしまっている
        fs.readFile(p,(err,fileContent)=>{
            if(err){
                // return [];
                cb([]);
            }else{
                // return JSON.parse(fileContent);
                cb(JSON.parse(fileContent));
            }
        });
}

module.exports = class Product{
    constructor(title,imageUrl,description,price){
        this.title = title;
        this.imageUrl = imageUrl;
        this.description = description;
        this.price = price;

    }
    save(){
        this.id = Math.random().toString();
        getProductsFromFile(products=>{
            products.push(this);
            fs.writeFile(p,JSON.stringify(products),(err)=>{
                console.log(err);
            });//javascriptオブジェクトをjsonフォーマットに変換
        });
    }

    //fetchしたあとに実行したい処理をコールバック関数で受け取る
    static fetchAll(cb){
        getProductsFromFile(cb);
    }
    //fetchしたあとに実行したい処理をコールバック関数で受け取る

    static findById(id,cb){
        getProductsFromFile(products=>{
            const product = products.find(p=> p.id === id);
            cb(product);
        })
    }

}