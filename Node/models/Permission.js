const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Permission = new SequelizeAdapter('Permission');

module.exports = Permission;