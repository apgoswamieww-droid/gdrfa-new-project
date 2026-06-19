const apiValidateRequiredFields = (body, fieldMap) => {
  const errors = {};

  for (const [field, displayName] of Object.entries(fieldMap)) {
    const value = body[field];

    if (!value || value.toString().trim() === '') {
      errors[field] = `${displayName} is required`;
    }
  }

  return Object.keys(errors).length === 0 ? true : errors;
};

module.exports = {
  apiValidateRequiredFields
};