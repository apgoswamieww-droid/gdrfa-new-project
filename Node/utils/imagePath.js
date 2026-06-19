module.exports = function getRelativeUploadPath(fullPath) {
    return fullPath.replace(/\\/g, '/').split('uploads/').pop();
  };