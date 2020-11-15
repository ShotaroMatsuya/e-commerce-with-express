const path = require('path');

const express =require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');
const mongoConnect = require('./util/database').mongoConnect;

const app = express();//functionとしてimportされる

app.set('view engine','ejs');//template engineをセット
app.set('views','views');//viewファイルのフォルダ名をセット

const adminRoutes = require('./routes/admin');
// const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));//publicフォルダの場所を指定する

app.use((req, res, next) => {
    // User.findById(1)
    //   .then(user => {
    //     req.user = user;
    //     next();
    //   })
    //   .catch(err => console.log(err));
    next();
  });


app.use('/admin',adminRoutes);//routeオブジェクトをそのまま引数に(第一引数にsegmentをセット)
// app.use(shopRoutes);//routeオブジェクトをそのまま引数に

app.use('/',errorController.get404);



// const server = http.createServer(app);
// server.listen(3000);　↓expressによってhttpモジュールを使わずに以下のように短くかける↓
// app.listen(3000);


mongoConnect(()=>{
  app.listen(3000);
});