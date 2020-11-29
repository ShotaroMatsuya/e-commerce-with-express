const crypto = require('crypto');//nodejsがもともと持っているもの

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');

const sgMail = require('./config');


exports.getLogin = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split('=')[1].trim();//cookieを取得

    let message = req.flash('error');//array型,retrieve flash message & remove it automatically
    if(message.length > 0){
      message = message[0];
    }else{
      message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage:message,
        oldInput:{
          email:'',
          password:''
        },
        validationErrors:[]//フォームのcssスタイルを適応させるためのproperty
    });     
  };

exports.getSignup = (req,res,next) =>{
  let message = req.flash('error');
    if(message.length > 0){
      message = message[0];
    }else{
      message = null;
    }
  res.render('auth/signup',{
    path:'/signup',
    pageTitle:'Signup',
    errorMessage:message,
    oldInput:{
      email:'',
      password:'',
      confirmPassword:''
    },
    validationErrors:[]
  });
};
exports.postLogin = (req,res,next)=>{
    // req.isLoggedIn =true;//reqオブジェクトはすぐにリセットされるのでこの情報はredirect後に保持されない点に注意!(そのためcookieを使用する)
    // res.setHeader('Set-Cookie','loggedIn=true; HttpOnly');//HttpOnlyとするとブラウザのjavascriptから操作できなくなるのでcross-site-scripting-attacks対策になる
    //しかしcookieはブラウザから読み込めてしまい、書き換えもできてしまうのでsessionを使ってサーバーで値を保持する
    // req.session.isLoggedIn = true;//sessionオブジェクトに自由にプロパティをつけることができる
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage:errors.array()[0].msg,
        oldInput:{
          email:email,
          password:password
        },
        validationErrors:errors.array()
      });     
    }

    User.findOne({email:email})
      .then(user => {
        if(!user){
          // req.flash('error','Invalid email or password.');//connect-flashにより提供されるflashメソッド
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage:'Invalid email or password.',
            oldInput:{
              email:email,
              password:password
            },
            validationErrors:[]//あえてpassとaddressのどちらが間違ってるかを示さないためにstyleは指定しないようにする
          });     
        }
        bcrypt
          .compare(password,user.password) //compareメソッドでhash化されたものと比較する(true or falseを返す)
          .then(doMatch =>{
            if(doMatch){
              req.session.isLoggedIn = true;
              req.session.user = user;
              return req.session.save(err =>{//確実にsaveしてからredirectする(処理に時間がかかる場合があるため)
                console.log(err);
                res.redirect('/');
              });
            }
            // req.flash('error','Invalid email or password.');
            return res.status(422).render('auth/login', {
              path: '/login',
              pageTitle: 'Login',
              errorMessage:'Invalid email or password.',
              oldInput:{
                email:email,
                password:password
              },
              validationErrors:[]//あえてpassとaddressのどちらが間違ってるかを示さないためにstyleは指定しないようにする
            });  
          })
          .catch(err=>{ //compareに対するcatch
            console.log(err);
            res.redirect('/login');
          });
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });//findOneに対するcatch
};

exports.postSignup = (req,res,next) =>{
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);//middlewareが検知したエラーを自動的に受け取る
  if(!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render('auth/signup',{
      path:'/signup',
      pageTitle:'Signup',
      errorMessage:errors.array()[0].msg,
      oldInput:{
        email:email, 
        password:password, 
        confirmPassword:req.body.confirmPassword
      },
      validationErrors:errors.array()
    });
  }
  // User.findOne({email:email})
  //   .then(userDoc =>{
  //     if(userDoc){
  //       req.flash('error','E-mail exists already, please pick a different one.');
  //       return res.redirect('/signup');
  //     }
      bcrypt
        .hash(password,12)
        .then(hashedPassword =>{
          const user = new User({
            email:email,
            password:hashedPassword,
            cart:{items:[]}
          });
          return user.save();
        })
        .then(result =>{
          const msg = {
            to:email,
            from:'info@smat710.com',
            subject:'Signup succeeded!',
            html:'<h1>You successfully signed up!</h1>'
          };
          res.redirect('/login');
          return sgMail.send(msg);
        })
        .then(()=>{
          console.log('Email sent');
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
};

exports.postLogout = (req,res,next) =>{
    req.session.destroy((err)=>{
        console.log(err);
        res.redirect('/');
    });
};
exports.getReset = (req,res,next) =>{
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];

  }else{
    message = null;
  }
  res.render('auth/reset',{
    path:'/reset',
    pageTitle:'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req,res,next)=>{
  crypto.randomBytes(32,(err,buffer)=>{
    if(err){
      console.log(err);
      return res.redirect('/reset');
    }
    //このtokenをdbに保持する
    const token = buffer.toString('hex');
    User.findOne({email:req.body.email})
      .then(user =>{
        if(!user){
          req.flash('error','No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;//user-modelにinsert
        user.resetTokenExpiration = Date.now() + 3600000;//1hours
        return user.save();
      })
      .then(result =>{//mail送信
        const msg = {
          to:req.body.email,
          from:'info@smat710.com',
          subject:'Password reset',
          html:`
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
          `
        };
        res.redirect('/');
        return sgMail.send(msg);
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req,res,next)=>{
  const token = req.params.token;
  User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}})//dbにあるtokenと同一でかつ、token使用期限が現在日時よりも先
    .then(user =>{
      let message = req.flash('error');
      if(message.length > 0){
        message = message[0];
      }else{
        message = null;
      }
      res.render('auth/new-password',{
        path:'/new-password',
        pageTitle: 'New Password',
        errorMessage:message,
        userId:user._id.toString(),//userIdもviewに送信
        passwordToken:token
      });
      
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

};
exports.postNewPassword = (req,res,next) =>{
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration:{$gt:Date.now()},
    _id:userId
  })
    .then(user =>{
      resetUser = user;
      return bcrypt.hash(newPassword,12);
    })
    .then(hashedPassword =>{
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result =>{
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

};