const createUploader = require('./multer');
const multer = require('multer');

const handleFileUpload = (req, res, fieldName, uploadPath = 'uploads/', categoryNames = []) => {
  return new Promise((resolve, reject) => {
    const uploader = createUploader(uploadPath, categoryNames);

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
      resolve();
    });
  });
};

module.exports = handleFileUpload;
