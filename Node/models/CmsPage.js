const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const CmsPage = new SequelizeAdapter('CmsPage');

module.exports = CmsPage;
