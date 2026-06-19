const validateRequiredFields = async (body, fieldMap) => {
  const errors = [];

  for (const [field, displayName] of Object.entries(fieldMap)) {
    const value = body[field];

    if (!value || value.toString().trim() === '') {
      errors.push(`${displayName}`);
    }
  }

  if (errors.length > 0) {
    if (errors.length == 1) {
      return errors.join(', ') + ' is required';
    }
    else {
      return errors.join(', ') + ' are required';
    }
  }
  else {
    return true;
  }

};

module.exports = {
  validateRequiredFields
};