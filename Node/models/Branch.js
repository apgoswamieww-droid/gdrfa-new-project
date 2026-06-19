const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Branch = new SequelizeAdapter('Branch');

module.exports = Branch;