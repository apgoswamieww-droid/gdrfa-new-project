const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Section = new SequelizeAdapter('Section');

module.exports = Section;