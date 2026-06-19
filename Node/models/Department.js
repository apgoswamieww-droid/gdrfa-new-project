const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Department = new SequelizeAdapter('Department');

module.exports = Department;