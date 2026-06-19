const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const EventCertificate = new SequelizeAdapter('EventCertificate');

module.exports = EventCertificate;
