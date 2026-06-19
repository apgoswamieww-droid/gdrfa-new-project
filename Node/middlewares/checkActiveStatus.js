// middleware/checkActiveStatus.js
const db = require('../config/dbDirect');

module.exports = async function (req, res, next) {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    try {
        next();
    } catch (err) {
        next(err);
    }
};
