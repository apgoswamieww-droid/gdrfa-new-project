const db = require('../../config/dbDirect');
const imagePath = require('../../utils/imagePath');
const fs = require('fs');
const path = require('path');

class FacilityController {
    // ==================== LIST FACILITIES ====================
    static async list(req, res) {
        try {
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';

            let whereClause = 'WHERE deletedAt IS NULL';
            const params = [];

            if (search) {
                whereClause += ' AND (title LIKE ? OR description LIKE ? OR title_ar LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM facilities ${whereClause}`,
                params
            );
            const total = countResult.total || 0;

            const data = await db.query(
                `SELECT * FROM facilities ${whereClause} 
                 ORDER BY createdAt DESC 
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, start, length]
            );

            return res.json({
                status: true,
                message: 'Facilities retrieved successfully',
                data: {
                    data,
                    total
                }
            });
        } catch (error) {
            console.error('Error in list facilities:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== CREATE FACILITY ====================
    static async store(req, res) {
        try {
            const { title, title_ar, description, description_ar } = req.body;
            
            if (!title || !title_ar || !description || !description_ar) {
                return res.status(400).json({ status: false, message: 'All bilingual fields (title and description) are required' });
            }

            let image = null;
            if (req.file) {
                image = `uploads/${imagePath(req.file.path)}`;
            }

            await db.query(
                `INSERT INTO facilities (title, title_ar, description, description_ar, image, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, '1', SYSDATETIME(), SYSDATETIME())`,
                [title, title_ar, description, description_ar, image]
            );

            return res.json({ status: true, message: 'Facility created successfully' });
        } catch (error) {
            console.error('Error in store facility:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== UPDATE FACILITY ====================
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { title, title_ar, description, description_ar } = req.body;

            if (!title || !title_ar || !description || !description_ar) {
                return res.status(400).json({ status: false, message: 'All bilingual fields (title and description) are required' });
            }

            const facility = await db.queryOne('SELECT * FROM facilities WHERE id = ? AND deletedAt IS NULL', [id]);
            if (!facility) {
                return res.status(404).json({ status: false, message: 'Facility not found' });
            }

            let image = facility.image;
            if (req.file) {
                // Delete old image
                if (facility.image && fs.existsSync(path.join(__dirname, '../../public', facility.image))) {
                    try { fs.unlinkSync(path.join(__dirname, '../../public', facility.image)); } catch (e) {}
                }
                image = `uploads/${imagePath(req.file.path)}`;
            }

            await db.query(
                `UPDATE facilities SET title = ?, title_ar = ?, description = ?, description_ar = ?, 
                 image = ?, updatedAt = SYSDATETIME() WHERE id = ?`,
                [title, title_ar, description, description_ar, image, id]
            );

            return res.json({ status: true, message: 'Facility updated successfully' });
        } catch (error) {
            console.error('Error in update facility:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== DELETE FACILITY ====================
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const facility = await db.queryOne('SELECT * FROM facilities WHERE id = ? AND deletedAt IS NULL', [id]);
            
            if (!facility) {
                return res.status(404).json({ status: false, message: 'Facility not found' });
            }

            await db.query('UPDATE facilities SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?', [id]);

            return res.json({ status: true, message: 'Facility deleted successfully' });
        } catch (error) {
            console.error('Error in delete facility:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== TOGGLE STATUS ====================
    static async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            await db.query('UPDATE facilities SET status = ?, updatedAt = SYSDATETIME() WHERE id = ?', [status, id]);
            return res.json({ status: true, message: 'Status updated successfully' });
        } catch (error) {
            console.error('Error in toggleStatus:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== LIST FACILITY REQUESTS ====================
    static async listRequests(req, res) {
        try {
            const draw = parseInt(req.query.draw) || 1;
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            
            const result = await db.query(
                `SELECT 
                    FR.id, FR.facility_id, FR.name, FR.email,
                    FORMAT(FR.date, 'yyyy-MM-dd HH:mm:ss') as date,
                    FR.description, FR.status,
                    FORMAT(FR.createdAt, 'yyyy-MM-dd HH:mm:ss') as createdAt,
                    F.title as title, F.image as image
                 FROM [Sports].[dbo].[facility_requests] FR
                 LEFT JOIN [Sports].[dbo].[facilities] F ON FR.facility_id = F.id
                 WHERE FR.deletedAt IS NULL
                 ORDER BY FR.createdAt desc
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [start, length]
            );

            const resultTotal = await db.query(
                `SELECT count(1) as countData
                 FROM [Sports].[dbo].[facility_requests]
                 WHERE deletedAt IS NULL`
            );

            return res.success(
                {
                    draw,
                    recordsTotal: resultTotal[0].countData,
                    recordsFiltered: resultTotal[0].countData,
                    data: result,
                },
                req.t ? req.t('Facilities requests loaded successfully') : 'Facilities requests loaded successfully'
            );
        } catch (error) {
            console.error('Error loading facilities request:', error.message);
            return res.error(req.t ? req.t('Failed to load facilities request') : 'Failed to load facilities request', 500);
        }
    }
}

module.exports = FacilityController;
