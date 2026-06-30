const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Plan = new SequelizeAdapter('Plan');

module.exports = Plan;
