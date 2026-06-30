const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Event = new SequelizeAdapter('Event');

module.exports = Event;
