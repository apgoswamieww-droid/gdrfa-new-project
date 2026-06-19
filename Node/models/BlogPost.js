const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const BlogPost = new SequelizeAdapter('BlogPost');

module.exports = BlogPost;