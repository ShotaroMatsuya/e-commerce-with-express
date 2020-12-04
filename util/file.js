// const fs = require('fs');
//指定したfileを削除するutility function
// const deleteFile = (filePath) =>{
//     fs.unlink(filePath,(err) =>{
//         if(err){
//             throw(err);
//         }
//     });
// };
const AWS = require('aws-sdk');

const deleteFile = filePath => {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  s3.deleteObject(
    {
      Bucket: process.env.MY_BUCKET,
      Key: filePath,
    },
    function (err, data) {
      console.log(data);
      if (err) {
        throw err;
      }
    }
  );
};

exports.deleteFile = deleteFile;
