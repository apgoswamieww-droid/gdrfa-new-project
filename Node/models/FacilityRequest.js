const { SequelizeAdapter } = require('../config/sequelizeAdapter');

const FacilityRequest = new SequelizeAdapter('FacilityRequest');

module.exports = FacilityRequest;