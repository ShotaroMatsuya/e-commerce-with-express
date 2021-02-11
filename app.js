const path = require('path');
const fs = require('fs');
const https = require('https');
//追加しました
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session); //sessionをmongoDBで保持する。引数にsessionオブジェクトを渡す
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const errorController = require('./controllers/error');
// const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/user');
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.h29dy.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express(); //functionとしてimportされる
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});
//init csurf
const csrfProtection = csrf();

//ssl
// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'images'); //第一引数はerrorメッセージ,第二引数はフォルダ名
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString() + '-' + file.originalname); //第一引数はerrorメッセージ,file命名パターンの設定
//   },
// });

//init s3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
//s3 config
const fileStorage = multerS3({
  s3: s3,
  bucket: process.env.MY_BUCKET,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  storageClass: 'STANDARD',
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const filePath = `uploads/${Date.now().toString()}-${file.originalname}`;
    cb(null, filePath);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set('view engine', 'ejs'); //template engineをセット
app.set('views', 'views'); //viewファイルのフォルダ名をセット

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

//body-parserはtext系データをx-www-form-urlencodedによって取得することができるが、file(バイナリーデータ)はextractできない
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(
//   multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
// ); //destにstorageフォルダ名、singleにinputのname属性をセット

//aws middleware
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

app.use(express.static(path.join(__dirname, 'public'))); //publicフォルダの場所を指定する
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
//resaveをfalseにすることでreqのたびにsessionを保存するのではなく、変化があったときのみに保存する(performanceがあがる)
app.use(csrfProtection);
//init connect-flash
app.use(flash());

app.use((req, res, next) => {
  //res.localsはviewに自動的に渡されるvariable
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use((req, res, next) => {
  // throw new Error('SYNC DUMMY');
  //syncコード内のエラーは、直接error handing middlewareに届くが、、、
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      //fetchできなかった場合のエラーハンドリング
      // throw new Error('async dummy');
      //promise内のエラーは直接error handling middlewareに届かない
      if (!user) {
        //user
        return next();
      }
      req.user = user; //mongooseのmodelオブジェクトをセット
      next();
    })
    .catch(err => {
      //connectionなどのエラーハンドリング
      // throw new Error(err);
      next(new Error(err)); //promise内のエラーはnext()で受け取る
    });
});

app.use('/admin', adminRoutes); //routeオブジェクトをそのまま引数に(第一引数にsegmentをセット)
app.use(shopRoutes); //routeオブジェクトをそのまま引数に
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);

//error middlewareの定義
app.use((error, req, res, next) => {
  // res.redirect('/500');
  console.log(error);
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn,
  });
});

// const server = http.createServer(app);
// server.listen(3000);　↓expressによってhttpモジュールを使わずに以下のように短くかける↓
// app.listen(3000);

// mongoConnect(()=>{
//   app.listen(3000);
// });
mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(process.env.PORT || 3000);
    // https
    //   .createServer({key:privateKey,cert:certificate},app)
    //   .listen(process.env.PORT || 3000);
  })
  .catch(err => {
    console.log(err);
  });
