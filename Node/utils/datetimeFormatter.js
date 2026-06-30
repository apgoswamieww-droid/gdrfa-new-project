const moment = require('moment');

// Helper function for formatting all date fields
const formatDate = (date) => {
  return date && moment(date).isValid()
    ? moment(date).utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss')
    : null;
};

module.exports = (model) => {
  model.prototype.toJSON = function () {
    const attributes = { ...this.get() };

    ['createdAt', 'updatedAt', 'deletedAt'].forEach((key) => {
      if (attributes[key]) {
        attributes[key] = formatDate(attributes[key]);
      }
    });

    return attributes;
  };
};