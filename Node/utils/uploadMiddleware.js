const multer = require('multer');
const { sanitizeObject } = require('./sanitize');

function wrapMulter(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ status: false, message: 'File too large. Max 100MB allowed.' });
        }
        return res.status(400).json({ status: false, message: err.message });
      }
      if (err) {
        return res.status(400).json({ status: false, message: err.message });
      }
      sanitizeObject(req.body);
      next();
    });
  };
}

module.exports = { wrapMulter };
