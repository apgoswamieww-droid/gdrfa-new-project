const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Tag = new SequelizeAdapter('Tag');

module.exports = Tag;
