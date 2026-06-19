const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Evaluation = new SequelizeAdapter('Evaluation');

module.exports = Evaluation;
