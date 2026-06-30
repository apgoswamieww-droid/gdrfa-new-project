const db = require('../../config/dbDirect');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class GlimpseOfSportsController {
    static async list(req, res) {
        try {
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';

            let whereClause = 'WHERE deletedAt IS NULL';
            const params = [];

            if (search) {
                whereClause += ' AND (description LIKE ? OR description_ar LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM glimpse_of_sports ${whereClause}`,
                params
            );
            const total = countResult.total || 0;

            const data = await db.query(
                `SELECT * FROM glimpse_of_sports ${whereClause} 
                 ORDER BY createdAt DESC 
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, start, length]
            );

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const formatted = data.map(g => ({
                ...g,
                status: g.status === "1" ? "1" : "0",
                image_url: g.image
                    ? (g.image.startsWith('http') ? g.image : `${baseUrl}/${g.image}`)
                    : ''
            }));

            return res.json({
                status: true,
                message: 'Glimpse images retrieved successfully',
                data: { data: formatted, total }
            });
        } catch (error) {
            console.error('Error in list glimpse:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async store(req, res) {
        try {
            const { description, description_ar } = req.body;

            if (!req.file) {
                return res.status(400).json({ status: false, message: 'Image file is required' });
            }

            const filePath = req.file.path;
            const { size, mimetype } = req.file;
            const maxImageSize = 20 * 1024 * 1024;

            const cleanup = () => { try { fs.unlinkSync(filePath); } catch {} };

            if (!mimetype.startsWith('image/')) {
                cleanup();
                return res.status(400).json({ status: false, message: 'Only image files are allowed' });
            }

            if (size > maxImageSize) {
                cleanup();
                return res.status(400).json({ status: false, message: 'Image file too large. Max 20MB allowed.' });
            }

            if (description && description.length > 100) {
                cleanup();
                return res.status(400).json({ status: false, message: 'Description must be 100 characters or less' });
            }

            if (description_ar && description_ar.length > 100) {
                cleanup();
                return res.status(400).json({ status: false, message: 'Arabic description must be 100 characters or less' });
            }

            const imagePath = `uploads/glimpseOfSports/${req.file.filename}`;

            await db.query(
                `INSERT INTO glimpse_of_sports (image, description, description_ar, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, '1', SYSDATETIME(), SYSDATETIME())`,
                [imagePath, description || null, description_ar || null]
            );

            return res.json({ status: true, message: 'Glimpse image created successfully' });
        } catch (error) {
            console.error('Error in store glimpse:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const glimpseId = req.params.id;
            const { description, description_ar } = req.body;

            const glimpse = await db.queryOne(
                `SELECT * FROM glimpse_of_sports WHERE id = ? AND deletedAt IS NULL`,
                [glimpseId]
            );

            if (!glimpse) {
                return res.status(404).json({ status: false, message: 'Glimpse image not found' });
            }

            if (description && description.length > 100) {
                return res.status(400).json({ status: false, message: 'Description must be 100 characters or less' });
            }

            if (description_ar && description_ar.length > 100) {
                return res.status(400).json({ status: false, message: 'Arabic description must be 100 characters or less' });
            }

            let imagePath = glimpse.image;

            if (req.file) {
                const filePath = req.file.path;
                const { size, mimetype } = req.file;
                const maxImageSize = 20 * 1024 * 1024;

                const cleanup = () => { try { fs.unlinkSync(filePath); } catch {} };

                if (!mimetype.startsWith('image/')) {
                    cleanup();
                    return res.status(400).json({ status: false, message: 'Only image files are allowed' });
                }

                if (size > maxImageSize) {
                    cleanup();
                    return res.status(400).json({ status: false, message: 'Image file too large. Max 20MB allowed.' });
                }

                imagePath = `uploads/glimpseOfSports/${req.file.filename}`;

                if (glimpse.image) {
                    const oldPath = path.join(__dirname, '../../', glimpse.image);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
            }

            await db.query(
                `UPDATE glimpse_of_sports SET image = ?, description = ?, description_ar = ?, updatedAt = SYSDATETIME()
                 WHERE id = ?`,
                [
                    imagePath,
                    description !== undefined ? (description || null) : glimpse.description,
                    description_ar !== undefined ? (description_ar || null) : glimpse.description_ar,
                    glimpseId
                ]
            );

            return res.json({ status: true, message: 'Glimpse image updated successfully' });
        } catch (error) {
            console.error('Error in update glimpse:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const glimpseId = req.params.id;
            const glimpse = await db.queryOne(
                `SELECT * FROM glimpse_of_sports WHERE id = ? AND deletedAt IS NULL`,
                [glimpseId]
            );

            if (!glimpse) {
                return res.status(404).json({ status: false, message: 'Glimpse image not found' });
            }

            if (glimpse.image) {
                const imagePath = path.join(__dirname, '../../', glimpse.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            await db.query(
                `UPDATE glimpse_of_sports SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
                [glimpseId]
            );

            return res.json({ status: true, message: 'Glimpse image deleted successfully' });
        } catch (error) {
            console.error('Error in delete glimpse:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // Public: get active images for the website
    static async publicList(req, res) {
        try {
            const baseUrl = `${req.protocol}://${req.get('host')}`;

            const data = await db.query(
                `SELECT id, image, description, description_ar
                 FROM glimpse_of_sports 
                 WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
                 ORDER BY createdAt DESC`
            );

            const formatted = (data || []).map(g => ({
                id: g.id,
                description: g.description,
                description_ar: g.description_ar,
                image_url: g.image
                    ? (g.image.startsWith('http') ? g.image : `${baseUrl}/${g.image}`)
                    : ''
            }));

            return res.json({
                status: true,
                message: 'Glimpse images retrieved successfully',
                data: formatted
            });
        } catch (error) {
            console.error('Error in public glimpse list:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = GlimpseOfSportsController;
