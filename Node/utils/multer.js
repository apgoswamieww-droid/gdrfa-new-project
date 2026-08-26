const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { resolveExtensions, resolveMimeTypes, isDangerousExtension } = require('./fileTypeConfig');

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const createUploader = (uploadPath = 'uploads/', categoryNames = []) => {
  const allowedExtensions = resolveExtensions(categoryNames);
  const allowedMimeTypes = resolveMimeTypes(categoryNames);

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(__dirname, '../', uploadPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = Date.now() + ext;
      cb(null, uniqueName);
    },
  });

  const fileFilter = function (req, file, cb) {
    if (isDangerousExtension(file.originalname)) {
      return cb(new Error('File type not allowed'));
    }

    if (categoryNames.length > 0) {
      const ext = path.extname(file.originalname).toLowerCase();
      const extOk = allowedExtensions.includes(ext);
      const mimeOk = allowedMimeTypes.some((mt) => file.mimetype === mt || file.mimetype.startsWith(mt));

      if (!extOk && !mimeOk) {
        return cb(new Error(`Only allowed file types: ${allowedExtensions.join(', ')}`));
      }
    }

    cb(null, true);
  };

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
  });
};

module.exports = createUploader;
