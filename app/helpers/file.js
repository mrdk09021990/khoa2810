const path 			= require('path');
const fs 			= require ('fs');
var multer 			= require('multer');
var randomstring 	= require('randomstring');


let uploadFile =   (field , folderDes = `items` , fileNameLength = 7 , fileSizeMb = 1 , fileExtension = 'jpeg|jpg|png|gif') => {

	var storage = multer.diskStorage({
		destination :  (req ,file , cb ) => {
			cb(null , __path_uploads  + folderDes + '/')
		},
		
		filename:  (req, file , cb) => {
			cb(null , randomstring.generate(fileNameLength) + path.extname(file.originalname));
		}
	});
	
	var upload = multer ({
		storage: storage,
		limits: {
			fileSize: fileSizeMb * 1024 * 1024,
		},
		fileFilter:  (req , file , cb)  => {
			const fileTypes = new RegExp (fileExtension);
			const extname 	= fileTypes.test(path.extname(file.originalname).toLowerCase());
			const mimetype 	= fileTypes.test(file.mimetype);
	
			if (mimetype && extname) {
				return cb (null , true);
			}else{
				cb  ('file nay ko ho tro');
			}
		}
	}).single(field);
	
	return upload;
	
}

let removeFile = (folder , fileName) => {
		if (fileName != "" && fileName != undefined){
			let path = folder + fileName ;
			if(fs.existsSync(path))
			fs.unlink(path , (err) => { 
				if (err) throw err;
			});
		}
		
}
	
module.exports = {
    upload: uploadFile,
	remove: removeFile
}