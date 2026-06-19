const createUploader = require('./multer'); // ✅ CORRECT import
const multer = require('multer');

const handleFileUpload = (req, res, fieldName, uploadPath = 'uploads/') => {
  return new Promise((resolve, reject) => {
    const uploader = createUploader(uploadPath);

    uploader.single(fieldName)(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return reject({
          status: 400,
          message:
            err.code === 'LIMIT_FILE_SIZE'
              ? req.t('File is too large. Max size is 2MB.')
              : err.message
        });
      } else if (err) {
        return reject({
          status: 400,
          message: req.t(err.message)
        });
      }
      resolve(); // ✅ Upload successful
    });
  });
};

module.exports = handleFileUpload;


// const handleFileUpload = (req, res, filename,uploadPath = 'uploads/') => {
//   return new Promise((resolve, reject) => {
//     upload.single(filename)(req, res, function (err) {
//       if (err instanceof multer.MulterError) {
//         // Known Multer error (like file too big)
//         return reject({
//           status: 400,
//           message: err.code === 'LIMIT_FILE_SIZE' ? req.t('File is too large. Max size is 2MB.') : err.message
//         });
//       } else if (err) {
//         // Unknown error
//         return reject({
//           status: 400,
//           message: req.t(err.message)
//         });
//       }
//       // No error — success
//       resolve();
//     });
//   });
// };

// module.exports = handleFileUpload;
