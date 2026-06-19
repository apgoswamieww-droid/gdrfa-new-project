const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const JobTitle = new SequelizeAdapter('JobTitle');

module.exports = JobTitle;
