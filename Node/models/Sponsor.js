const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Sponsor = new SequelizeAdapter('Sponsor');

module.exports = Sponsor;