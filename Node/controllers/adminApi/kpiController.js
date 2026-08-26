const db = require('../../config/dbDirect');
const { sanitizeHtml } = require('../../utils/sanitize');

class KpiController {
    static async list(req, res) {
        try {
            const kpis = await db.query(`SELECT id, name, status, createdAt FROM kpis WHERE deletedAt IS NULL ORDER BY createdAt DESC`);
            return res.json({
                status: true,
                message: 'KPIs retrieved successfully',
                data: {
                    data: kpis,
                    total: kpis.length
                }
            });
        } catch (error) {
            console.error('Error in list KPIs:', error);
            return res.serverError(error);
        }
    }

    static async store(req, res) {
        try {
            const { name, status } = req.body;
            const cleanName = sanitizeHtml(name);
            if (!cleanName) {
                return res.status(400).json({ status: false, message: 'KPI name is required' });
            }

            // Check for duplicate
            const existing = await db.queryOne(`SELECT id FROM kpis WHERE name = ? AND deletedAt IS NULL`, [cleanName]);
            if (existing) {
                return res.status(409).json({ status: false, message: 'KPI name already exists' });
            }

            const sql = `INSERT INTO kpis (name, status, createdAt, updatedAt) VALUES (?, ?, SYSDATETIME(), SYSDATETIME())`;
            await db.query(sql, [cleanName, status || '1']);
            
            return res.json({ status: true, message: 'KPI created successfully' });
        } catch (error) {
            console.error('Error in store KPI:', error);
            return res.serverError(error);
        }
    }

    static async update(req, res) {
        try {
            const { name, status } = req.body;
            const kpiId = req.params.id;
            const cleanName = sanitizeHtml(name);

            if (!cleanName) {
                return res.status(400).json({ status: false, message: 'KPI name is required' });
            }

            // Check for duplicate (excluding current record)
            const existing = await db.queryOne(
                `SELECT id FROM kpis WHERE name = ? AND id != ? AND deletedAt IS NULL`, 
                [cleanName, kpiId]
            );

            if (existing) {
                return res.status(409).json({ status: false, message: 'KPI name already exists' });
            }

            // Only update status if provided
            let sql, params;
            if (status !== undefined) {
                sql = `UPDATE kpis SET name = ?, status = ?, updatedAt = SYSDATETIME() WHERE id = ?`;
                params = [cleanName, status, kpiId];
            } else {
                sql = `UPDATE kpis SET name = ?, updatedAt = SYSDATETIME() WHERE id = ?`;
                params = [cleanName, kpiId];
            }

            await db.query(sql, params);
            return res.json({ status: true, message: 'KPI updated successfully' });
        } catch (error) {
            console.error('Error in update KPI:', error);
            return res.serverError(error);
        }
    }

    static async delete(req, res) {
        try {
            const kpiId = req.params.id;
            await db.query(`UPDATE kpis SET deletedAt = SYSDATETIME() WHERE id = ?`, [kpiId]);
            return res.json({ status: true, message: 'KPI deleted successfully' });
        } catch (error) {
            console.error('Error in delete KPI:', error);
            return res.serverError(error);
        }
    }
}

module.exports = KpiController;
