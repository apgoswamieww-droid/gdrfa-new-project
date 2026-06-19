const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const ActivityType = new SequelizeAdapter('ActivityType');

module.exports = ActivityType;
