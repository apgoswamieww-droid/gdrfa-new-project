const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const EvaluationResult = new SequelizeAdapter('EvaluationResult');

module.exports = EvaluationResult;
