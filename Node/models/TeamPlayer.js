const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const TeamPlayer = new SequelizeAdapter('TeamPlayer');

module.exports = TeamPlayer;
