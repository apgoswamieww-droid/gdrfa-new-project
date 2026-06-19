const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Facilities = new SequelizeAdapter('Facilities');

module.exports = Facilities;