const path = require('path');

const express =require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
// const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/user');

const app = express();//functionとしてimportされる

app.set('view engine','ejs');//template engineをセット
app.set('views','views');//viewファイルのフォルダ名をセット

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));//publicフォルダの場所を指定する

app.use((req, res, next) => {
    User.findById("5fb4cb6c16bea6171d1af775")
      .then(user => {
        req.user = user;
        next();
      })
      .catch(err => console.log(err));
  
  });


app.use('/admin',adminRoutes);//routeオブジェクトをそのまま引数に(第一引数にsegmentをセット)
app.use(shopRoutes);//routeオブジェクトをそのまま引数に

app.use('/',errorController.get404);



// const server = http.createServer(app);
// server.listen(3000);　↓expressによってhttpモジュールを使わずに以下のように短くかける↓
// app.listen(3000);


// mongoConnect(()=>{
//   app.listen(3000);
// });
mongoose.connect('mongodb+srv://shotaro:S6PmAPGB9tnOdkE2@cluster0.h29dy.mongodb.net/shop?retryWrites=true&w=majority')
  .then(result=>{
    User.findOne().then(user =>{
      if(!user){
        const user = new User({
          name:'Shotaro',
          email:'test@test.com',
          cart:{
            items:[]
          }
        });
        user.save();

      }
    });
    app.listen(3000);
  }
  ).catch(err =>{
    console.log(err);
  });
