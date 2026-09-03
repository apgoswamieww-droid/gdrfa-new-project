const { getFullAssetUrl } = require('../../utils/baseUrl');
const db = require('../../config/dbDirect');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPER_ADMIN_ROLE_ID = String(process.env.SUPERADMINROLEID || '').trim();

function isSuperAdmin(req) {
  return String(req.user?.roleId || '').trim() === SUPER_ADMIN_ROLE_ID;
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname;
  } catch (e) {
    return false;
  }
}

class SocialLinkController {
    static async list(req, res) {
        try {
            if (!isSuperAdmin(req)) {
                return res.status(403).json({ status: false, message: 'Access denied. Only Super Admin can access this module.' });
            }

            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (search) {
                whereClause += ' AND (link LIKE ?)';
                params.push(`%${search}%`);
            }

            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM social_links ${whereClause}`,
                params
            );
            const total = countResult.total || 0;

            const data = await db.query(
                `SELECT * FROM social_links ${whereClause} 
                 ORDER BY createdAt DESC 
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, start, length]
            );

            const formatted = data.map(s => ({
                ...s,
                status: s.status ? String(s.status) : "0",
                image_url: getFullAssetUrl(s.image) || ''
            }));

            return res.json({
                status: true,
                message: 'Social links retrieved successfully',
                data: { data: formatted, total }
            });
        } catch (error) {
            console.error('Error in list social links:', error);
            return res.serverError(error);
        }
    }

    static async store(req, res) {
        try {
            if (!isSuperAdmin(req)) {
                return res.status(403).json({ status: false, message: 'Access denied. Only Super Admin can access this module.' });
            }

            const { link, status } = req.body;

            if (!link || !link.trim()) {
                return res.status(400).json({ status: false, message: 'Link is required' });
            }

            if (!isValidUrl(link.trim())) {
                return res.status(400).json({ status: false, message: 'A valid link (http/https) is required' });
            }

            if (!req.file) {
                return res.status(400).json({ status: false, message: 'Icon image is required' });
            }

            const image = `uploads/socialLinks/${req.file.filename}`;

            await db.query(
                `INSERT INTO social_links (image, link, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, SYSDATETIME(), SYSDATETIME())`,
                [image, link.trim(), status || '1']
            );

            return res.json({ status: true, message: 'Social link created successfully' });
        } catch (error) {
            console.error('Error in store social link:', error);
            return res.serverError(error);
        }
    }

    static async update(req, res) {
        try {
            if (!isSuperAdmin(req)) {
                return res.status(403).json({ status: false, message: 'Access denied. Only Super Admin can access this module.' });
            }

            const socialLinkId = req.params.id;
            const { link, status } = req.body;

            const socialLink = await db.queryOne(
                `SELECT * FROM social_links WHERE id = ?`,
                [socialLinkId]
            );

            if (!socialLink) {
                return res.status(404).json({ status: false, message: 'Social link not found' });
            }

            let image = socialLink.image;
            if (req.file) {
                if (socialLink.image) {
                    const oldPath = path.join(__dirname, '../../', socialLink.image);
                    if (fs.existsSync(oldPath)) {
                        try { fs.unlinkSync(oldPath); } catch (e) { console.warn('Failed to delete old image:', e); }
                    }
                }
                image = `uploads/socialLinks/${req.file.filename}`;
            }

            const newLink = (link || '').trim();

            if (!newLink) {
                return res.status(400).json({ status: false, message: 'Link is required' });
            }

            if (!isValidUrl(newLink)) {
                return res.status(400).json({ status: false, message: 'A valid link (http/https) is required' });
            }

            await db.query(
                `UPDATE social_links SET link = ?, image = ?, status = ?, updatedAt = SYSDATETIME()
                 WHERE id = ?`,
                [newLink, image, status || socialLink.status, socialLinkId]
            );

            return res.json({ status: true, message: 'Social link updated successfully' });
        } catch (error) {
            console.error('Error in update social link:', error);
            return res.serverError(error);
        }
    }

    static async delete(req, res) {
        try {
            if (!isSuperAdmin(req)) {
                return res.status(403).json({ status: false, message: 'Access denied. Only Super Admin can access this module.' });
            }

            const socialLinkId = req.params.id;
            const socialLink = await db.queryOne(
                `SELECT * FROM social_links WHERE id = ?`,
                [socialLinkId]
            );

            if (!socialLink) {
                return res.status(404).json({ status: false, message: 'Social link not found' });
            }

            if (socialLink.image) {
                const imagePath = path.join(__dirname, '../../', socialLink.image);
                if (fs.existsSync(imagePath)) {
                    try { fs.unlinkSync(imagePath); } catch (e) { console.warn('Failed to delete image:', e); }
                }
            }

            // Hard delete (no soft delete for social_links)
            await db.query(
                `DELETE FROM social_links WHERE id = ?`,
                [socialLinkId]
            );

            return res.json({ status: true, message: 'Social link deleted successfully' });
        } catch (error) {
            console.error('Error in delete social link:', error);
            return res.serverError(error);
        }
    }
}

module.exports = SocialLinkController;
