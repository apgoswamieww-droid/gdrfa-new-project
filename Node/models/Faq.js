const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const Faq = new SequelizeAdapter('Faq');

module.exports = Faq;