const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Sector = new SequelizeAdapter('Sector');

module.exports = Sector;
