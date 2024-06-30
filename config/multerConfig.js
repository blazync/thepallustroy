const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define storage for single file upload (for categories)
const singleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/upload/single/';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Define storage for multiple file upload (for products)
const multipleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/upload/multiple/';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const singleUpload = multer({ storage: singleStorage });
const multipleUpload = multer({ storage: multipleStorage });

module.exports = { singleUpload, multipleUpload };
