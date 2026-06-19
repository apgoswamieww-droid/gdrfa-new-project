const db = require('../../config/dbDirect');
const imagePath = require('../../utils/imagePath');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class SponsorController {
    static async list(req, res) {
        try {
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';

            let whereClause = 'WHERE deletedAt IS NULL';
            const params = [];

            if (search) {
                whereClause += ' AND (name LIKE ? OR website_url LIKE ? OR discount_text LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM sponsors ${whereClause}`,
                params
            );
            const total = countResult.total || 0;

            const data = await db.query(
                `SELECT * FROM sponsors ${whereClause} 
                 ORDER BY createdAt DESC 
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, start, length]
            );

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const formatted = data.map(s => ({
                ...s,
                status: s.status ? "1" : "0",
                logo_url: s.logo ? (s.logo.startsWith('http') ? s.logo : `${baseUrl}/${s.logo}`) : ''
            }));

            return res.json({
                status: true,
                message: 'Sponsors retrieved successfully',
                data: { data: formatted, total }
            });
        } catch (error) {
            console.error('Error in list sponsors:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async store(req, res) {
        try {
            const { name, website_url, status } = req.body;

            if (!name || !website_url) {
                return res.status(400).json({ status: false, message: 'Name and website URL are required' });
            }

            let logo = null;
            if (req.file) {
                logo = `uploads/sponsors/${req.file.filename}`;
            }

            await db.query(
                `INSERT INTO sponsors (name, website_url, logo, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, SYSDATETIME(), SYSDATETIME())`,
                [name.trim(), website_url, logo, status || '1']
            );

            return res.json({ status: true, message: 'Sponsor created successfully' });
        } catch (error) {
            console.error('Error in store sponsor:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const sponsorId = req.params.id;
            const { name, website_url, discount_text, status } = req.body;

            const sponsor = await db.queryOne(
                `SELECT * FROM sponsors WHERE id = ? AND deletedAt IS NULL`,
                [sponsorId]
            );

            if (!sponsor) {
                return res.status(404).json({ status: false, message: 'Sponsor not found' });
            }

            let logo = sponsor.logo;
            if (req.file) {
                if (sponsor.logo) {
                    const oldPath = path.join(__dirname, '../../', sponsor.logo);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
                logo = `uploads/sponsors/${req.file.filename}`;
            }

            await db.query(
                `UPDATE sponsors SET name = ?, website_url = ?, discount_text = ?, logo = ?, status = ?, updatedAt = SYSDATETIME()
                 WHERE id = ?`,
                [name || sponsor.name, website_url || sponsor.website_url, discount_text || sponsor.discount_text, logo, status || sponsor.status, sponsorId]
            );

            return res.json({ status: true, message: 'Sponsor updated successfully' });
        } catch (error) {
            console.error('Error in update sponsor:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const sponsorId = req.params.id;
            const sponsor = await db.queryOne(
                `SELECT * FROM sponsors WHERE id = ? AND deletedAt IS NULL`,
                [sponsorId]
            );

            if (!sponsor) {
                return res.status(404).json({ status: false, message: 'Sponsor not found' });
            }

            if (sponsor.logo) {
                const logoPath = path.join(__dirname, '../../', sponsor.logo);
                if (fs.existsSync(logoPath)) {
                    fs.unlinkSync(logoPath);
                }
            }

            await db.query(
                `UPDATE sponsors SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
                [sponsorId]
            );

            return res.json({ status: true, message: 'Sponsor deleted successfully' });
        } catch (error) {
            console.error('Error in delete sponsor:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = SponsorController;
