const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const TokenBlacklist = new SequelizeAdapter('TokenBlacklist');

module.exports = TokenBlacklist;