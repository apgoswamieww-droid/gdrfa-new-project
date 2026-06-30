const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const EventActivitySchedule = new SequelizeAdapter('EventActivitySchedule');

module.exports = EventActivitySchedule;
