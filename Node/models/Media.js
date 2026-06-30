const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Media = new SequelizeAdapter('Media');

module.exports = Media;
