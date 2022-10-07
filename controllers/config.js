// const nodemailer = require('nodemailer');
// const sendgridTransport = require('nodemailer-sendgrid-transport');
//init nodemailer
// const transporter = nodemailer.createTransport(sendgridTransport({
//   auth:{
//     api_key:'SG*********'
//   }
// }));

const sgMail = require('@sendgrid/mail');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//init sendgrid
sgMail.setApiKey(process.env.SENDGRID_KEY);

module.exports.sgMail = sgMail;
module.exports.stripe = stripe;
