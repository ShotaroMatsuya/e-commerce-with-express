const path = require('path');

const express =require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore  = require('connect-mongodb-session')(session);//sessionをmongoDBで保持する。引数にsessionオブジェクトを渡す
const csrf = require('csurf');
const flash = require('connect-flash');

const errorController = require('./controllers/error');
// const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/user');
const MONGODB_URI = 'mongodb+srv://shotaro:S6PmAPGB9tnOdkE2@cluster0.h29dy.mongodb.net/shop';

const app = express();//functionとしてimportされる
const store = new MongoDBStore({
  uri:MONGODB_URI,
  collection:'sessions'
});
//init csurf
const csrfProtection = csrf();


app.set('view engine','ejs');//template engineをセット
app.set('views','views');//viewファイルのフォルダ名をセット

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));//publicフォルダの場所を指定する
app.use(session({
  secret:'my secret',
  resave:false,
  saveUninitialized:false,
  store:store
}));
//resaveをfalseにすることでreqのたびにsessionを保存するのではなく、変化があったときのみに保存する(performanceがあがる)
app.use(csrfProtection);
//init connect-flash
app.use(flash());

app.use((req,res,next)=>{
  if(!req.session.user){
    return next();
  }
  User.findById(req.session.user._id)
      .then(user => {
        req.user = user;//mongooseのmodelオブジェクトをセット
        next();
      })
      .catch(err => console.log(err));
});

app.use((req,res,next)=>{
  //res.localsはviewに自動的に渡されるvariable
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});



app.use('/admin',adminRoutes);//routeオブジェクトをそのまま引数に(第一引数にsegmentをセット)
app.use(shopRoutes);//routeオブジェクトをそのまま引数に
app.use(authRoutes);

app.use('/',errorController.get404);



// const server = http.createServer(app);
// server.listen(3000);　↓expressによってhttpモジュールを使わずに以下のように短くかける↓
// app.listen(3000);


// mongoConnect(()=>{
//   app.listen(3000);
// });
mongoose.connect(MONGODB_URI)
  .then(result=>{
    app.listen(3000);
  }
  ).catch(err =>{
    console.log(err);
  });
