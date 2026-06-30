const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const FitnessCategory = new SequelizeAdapter('FitnessCategory');

module.exports = FitnessCategory;