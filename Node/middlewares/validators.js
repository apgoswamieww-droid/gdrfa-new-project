const { body } = require('express-validator');

const loginValidationRules = [
  body('email')
    .isEmail()
    .withMessage((value, { req }) => req.t('Please enter a valid email')),

  body('password')
    .isLength({ min: 6 })
    .withMessage((value, { req }) => req.t('Password length should be at least 6 characters'))
];

module.exports = { loginValidationRules };