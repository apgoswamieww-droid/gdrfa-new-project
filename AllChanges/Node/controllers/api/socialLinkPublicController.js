const { getFullAssetUrl } = require('../../utils/baseUrl');
const db = require('../../config/dbDirect');

class SocialLinkPublicController {
  // GET /api/social-links — public, returns only active links
  static async getAll(req, res) {
    try {
      const links = await db.query(
        `SELECT id, link, image, status, createdAt
         FROM social_links
         WHERE status = '1'
         ORDER BY createdAt ASC`
      );

      const formatted = (links || []).map(s => ({
        id: s.id,
        link: s.link,
        image: getFullAssetUrl(s.image) || '',
        status: s.status,
        createdAt: s.createdAt,
      }));

      return res.json({ status: true, data: formatted });
    } catch (error) {
      console.error('Error fetching public social links:', error.message);
      return res.json({ status: true, data: [] });
    }
  }
}

module.exports = SocialLinkPublicController;
