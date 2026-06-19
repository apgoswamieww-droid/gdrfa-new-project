// utils/multer.js
// utils/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploader = (uploadPath = 'uploads/', allowedTypes = []) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(__dirname, '../', uploadPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueName = Date.now() + path.extname(file.originalname);
      cb(null, uniqueName);
    }
  });

  const fileFilter = function (req, file, cb) {
    if (allowedTypes.length === 0) return cb(null, true); // allow all if not specified

    const extName = allowedTypes.some(type => file.originalname.toLowerCase().endsWith(type));
    const mimeType = allowedTypes.some(type => file.mimetype.includes(type.split('/')[0]));

    if (extName && mimeType) cb(null, true);
    else cb(new Error(req.t(`Only allowed file types: ${allowedTypes.join(', ')}`)));
  };

  return multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // max 100MB
    fileFilter
  });
};

module.exports = createUploader;

// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const createUploader = (uploadPath = 'uploads/') => {
//   const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       const dir = path.join(__dirname, '../', uploadPath);

//       if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//       }

//       cb(null, dir);
//     },
//     filename: function (req, file, cb) {
//       const uniqueName = Date.now() + path.extname(file.originalname);
//       cb(null, uniqueName);
//     }
//   });

//   const fileFilter = function (req, file, cb) {
//     const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|ogg/;
//     const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimeType = allowedTypes.test(file.mimetype);

//     if (extName && mimeType) {
//       cb(null, true);
//     } else {
//       cb(new Error(req.t('Only image files (jpeg, jpg, png, gif) are allowed')));
//     }
//   };

//   return multer({
//     storage,
//     limits: { fileSize: 50 * 1024 * 1024 },
//     fileFilter
//   });
// };

// module.exports = createUploader;


// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config();

// // Multer Storage Configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const dir = path.join(__dirname, process.env.UPLOAD_PATH);

//     // Check if directory exists, if not create it
//     if (!fs.existsSync(dir)){
//       fs.mkdirSync(dir, { recursive: true });
//     }

//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = Date.now() + path.extname(file.originalname);
//     cb(null, uniqueName);
//   }
// });

// // File Type Validation
// const fileFilter = function (req, file, cb) {
//   const allowedTypes = /jpeg|jpg|png|gif/;
//   const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimeType = allowedTypes.test(file.mimetype);

//   if (extName && mimeType) {
//     cb(null, true);
//   } else {
//     cb(new Error(req.t('Only image files (jpeg, jpg, png, gif) are allowed')));
//   }
// };

// // Multer Upload Config
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 2 * 1024 * 1024 },
//   fileFilter: fileFilter
// });

// module.exports = upload;
