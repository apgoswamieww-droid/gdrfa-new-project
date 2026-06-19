const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const User = new SequelizeAdapter('User');

module.exports = User;
