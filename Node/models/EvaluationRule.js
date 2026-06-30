const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const EvaluationRule = new SequelizeAdapter('EvaluationRule');

module.exports = EvaluationRule;
