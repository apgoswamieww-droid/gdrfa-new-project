const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Role = new SequelizeAdapter('Role');

module.exports = Role;
