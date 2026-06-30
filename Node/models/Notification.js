const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Notification = new SequelizeAdapter('Notification');

module.exports = Notification;
