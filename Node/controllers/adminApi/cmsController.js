const db = require('../../config/dbDirect');

class CMSController {
    // ==================== LIST CMS PAGES ====================
    static async list(req, res) {
        try {
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';

            let whereClause = 'WHERE deletedAt IS NULL';
            const params = [];

            if (search) {
                whereClause += ' AND (name_en LIKE ? OR name_ar LIKE ? OR slug LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM cms_pages ${whereClause}`,
                params
            );
            const total = countResult.total || 0;

            const data = await db.query(
                `SELECT * FROM cms_pages ${whereClause} 
                 ORDER BY createdAt DESC 
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, start, length]
            );

            return res.json({
                status: true,
                message: 'CMS Pages retrieved successfully',
                data: {
                    data,
                    total
                }
            });
        } catch (error) {
            console.error('Error in list CMS Pages:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== GET SINGLE CMS PAGE ====================
    static async show(req, res) {
        try {
            const { id } = req.params;
            const page = await db.queryOne(
                `SELECT * FROM cms_pages WHERE id = ? AND deletedAt IS NULL`,
                [id]
            );

            if (!page) {
                return res.status(404).json({ status: false, message: 'CMS Page not found' });
            }

            return res.json({
                status: true,
                message: 'CMS Page retrieved successfully',
                data: page
            });
        } catch (error) {
            console.error('Error in show CMS Page:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== CREATE CMS PAGE ====================
    static async store(req, res) {
        try {
            const { name_en, name_ar, description_en, description_ar } = req.body;
            
            if (!name_en || !name_ar || !description_en || !description_ar) {
                return res.status(400).json({ status: false, message: 'All bilingual fields are required' });
            }

            const slug = name_en.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-')
                .trim();

            await db.query(
                `INSERT INTO cms_pages (name_en, name_ar, slug, description_en, description_ar, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, '1', SYSDATETIME(), SYSDATETIME())`,
                [name_en, name_ar, slug, description_en, description_ar]
            );

            return res.json({ status: true, message: 'CMS Page created successfully' });
        } catch (error) {
            console.error('Error in store CMS Page:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== UPDATE CMS PAGE ====================
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name_en, name_ar, description_en, description_ar, status } = req.body;

            if (!name_en || !name_ar || !description_en || !description_ar) {
                return res.status(400).json({ status: false, message: 'All bilingual fields are required' });
            }

            const page = await db.queryOne('SELECT * FROM cms_pages WHERE id = ? AND deletedAt IS NULL', [id]);
            if (!page) {
                return res.status(404).json({ status: false, message: 'CMS Page not found' });
            }

            const slug = name_en.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-')
                .trim();

            await db.query(
                `UPDATE cms_pages SET name_en = ?, name_ar = ?, slug = ?, description_en = ?, description_ar = ?, 
                 status = ?, updatedAt = SYSDATETIME() WHERE id = ?`,
                [name_en, name_ar, slug, description_en, description_ar, status || page.status, id]
            );

            return res.json({ status: true, message: 'CMS Page updated successfully' });
        } catch (error) {
            console.error('Error in update CMS Page:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== DELETE CMS PAGE ====================
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const page = await db.queryOne('SELECT * FROM cms_pages WHERE id = ? AND deletedAt IS NULL', [id]);
            
            if (!page) {
                return res.status(404).json({ status: false, message: 'CMS Page not found' });
            }

            await db.query('UPDATE cms_pages SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?', [id]);

            return res.json({ status: true, message: 'CMS Page deleted successfully' });
        } catch (error) {
            console.error('Error in delete CMS Page:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== TOGGLE STATUS ====================
    static async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            await db.query('UPDATE cms_pages SET status = ?, updatedAt = SYSDATETIME() WHERE id = ?', [status, id]);
            return res.json({ status: true, message: 'Status updated successfully' });
        } catch (error) {
            console.error('Error in toggleStatus:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = CMSController;
