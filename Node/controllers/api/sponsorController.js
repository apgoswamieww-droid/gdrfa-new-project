const db = require('../../config/dbDirect');
const responseFormatter = require('../../middlewares/responseFormatter');
const { getLocalizedMessage } = require('../../utils/apiLanguageHelper');

class SponsorController {
  // GET /api/sponsors
  static async getAllSponsors(req, res) {
    try {
      const sponsors = await db.query(
        `SELECT id, name, logo, website_url, discount_text, status, createdAt, updatedAt
         FROM sponsors
         WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
         ORDER BY createdAt DESC`
      );
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const sponsorsWithFullLogo = (sponsors || []).map(s => ({
        ...s,
        logo: s.logo ? (s.logo.startsWith('http') ? s.logo : `${baseUrl}/${s.logo}`) : ''
      }));
      return res.success(sponsorsWithFullLogo, getLocalizedMessage(req, 'Sponsors retrieved successfully.'));
    } catch (error) {
      console.error('Error fetching sponsors:', error.message);
      return res.error(getLocalizedMessage(req, 'Internal server error'));
    }
  }
}

module.exports = SponsorController;
