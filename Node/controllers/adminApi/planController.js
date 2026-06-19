const db = require('../../config/dbDirect');

// Plan Controller - manages yearly KPI plans
// Table: plans (id, year, kpi, status, createdAt, updatedAt, deletedAt)

class PlanController {
    static async list(req, res) {
        try {
            // Check if plans table exists
            const tableExists = await db.queryOne(`
                SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'plans'
            `);
            
            if (!tableExists || tableExists.cnt === 0) {
                return res.json({
                    status: true,
                    message: 'No plans table found',
                    data: { data: [], total: 0 }
                });
            }
            
            const plans = await db.query(`
                SELECT p.id, p.year, p.kpi, p.status, p.createdAt, p.updatedAt, k.name as kpi_name 
                FROM plans p
                LEFT JOIN kpis k ON p.kpi = k.id
                WHERE p.deletedAt IS NULL 
                ORDER BY p.year DESC, p.createdAt DESC
            `);
            return res.json({
                status: true,
                message: 'Plans retrieved successfully',
                data: {
                    data: plans || [],
                    total: plans?.length || 0
                }
            });
        } catch (error) {
            console.error('[DB Error]', error.message);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async store(req, res) {
        try {
            const { year, kpi, status } = req.body;
            if (!year) {
                return res.status(400).json({ status: false, message: 'Year is required' });
            }
            if (!kpi) {
                return res.status(400).json({ status: false, message: 'KPI is required' });
            }

            // Check for duplicate
            const existing = await db.queryOne(
                `SELECT id FROM plans WHERE year = ? AND kpi = ? AND deletedAt IS NULL`, 
                [year, kpi]
            );
            if (existing) {
                return res.status(409).json({ status: false, message: 'Plan for this year and KPI already exists' });
            }

            await db.query(
                `INSERT INTO plans (year, kpi, status, createdAt, updatedAt) VALUES (?, ?, ?, SYSDATETIME(), SYSDATETIME())`,
                [year, kpi, status || '1']
            );
            
            return res.json({ status: true, message: 'Plan created successfully' });
        } catch (error) {
            console.error('[DB Error]', error.message);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { year, kpi, status } = req.body;
            const planId = req.params.id;

            if (!year) {
                return res.status(400).json({ status: false, message: 'Year is required' });
            }
            if (!kpi) {
                return res.status(400).json({ status: false, message: 'KPI is required' });
            }

            // Check for duplicate (excluding current record)
            const existing = await db.queryOne(
                `SELECT id FROM plans WHERE year = ? AND kpi = ? AND id != ? AND deletedAt IS NULL`, 
                [year, kpi, planId]
            );
            if (existing) {
                return res.status(409).json({ status: false, message: 'Plan for this year and KPI already exists' });
            }

            const updates = [];
            const params = [];
            
            if (year !== undefined) {
                updates.push('year = ?');
                params.push(year);
            }
            if (kpi !== undefined) {
                updates.push('kpi = ?');
                params.push(kpi);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (updates.length === 0) {
                return res.status(400).json({ status: false, message: 'No fields to update' });
            }
            updates.push('updatedAt = SYSDATETIME()');
            params.push(planId);
            
            const sql = `UPDATE plans SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`;
            await db.query(sql, params);
            
            return res.json({ status: true, message: 'Plan updated successfully' });
        } catch (error) {
            console.error('[DB Error]', error.message);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const planId = req.params.id;
            await db.query(`UPDATE plans SET deletedAt = SYSDATETIME(), status = '0' WHERE id = ?`, [planId]);
            return res.json({ status: true, message: 'Plan deleted successfully' });
        } catch (error) {
            console.error('[DB Error]', error.message);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async getKpis(req, res) {
        try {
            const kpis = await db.query(`SELECT id, name FROM kpis WHERE status = '1' AND deletedAt IS NULL ORDER BY name`);
            return res.json({
                status: true,
                message: 'KPIs retrieved successfully',
                data: kpis || []
            });
        } catch (error) {
            console.error('[DB Error]', error.message);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = PlanController;
