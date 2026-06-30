const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const SportActivity = new SequelizeAdapter('SportActivity');

module.exports = SportActivity;
