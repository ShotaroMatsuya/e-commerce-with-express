const fs = require('fs');
//指定したfileを削除するutility function
const deleteFile = (filePath) =>{
    fs.unlink(filePath,(err) =>{
        if(err){
            throw(err);
        }
    });
};

exports.deleteFile = deleteFile;