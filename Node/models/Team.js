const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Team = new SequelizeAdapter('Team');

module.exports = Team;
