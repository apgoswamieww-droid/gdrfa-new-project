const db = require('../../config/dbDirect');

// Event Activities controller using sport_activities table
// Uses raw SQL queries for MSSQL compatibility

class EventActivityController {
    static async list(req, res) {
        try {
            const activities = await db.query(`
                SELECT 
                    sa.id,
                    sa.name,
                    sa.activityType,
                    sa.isTeam,
                    sa.image,
                    sa.status,
                    sa.createdAt,
                    at.name as activityTypeName
                FROM sport_activities sa
                LEFT JOIN activity_types at ON sa.activityType = at.id
                WHERE sa.deletedAt IS NULL
                ORDER BY sa.createdAt DESC
            `);
            
            return res.json({
                status: true,
                message: 'Event Activities retrieved successfully',
                data: {
                    data: activities,
                    total: activities.length
                }
            });
        } catch (error) {
            console.error('Error in list Event Activities:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async store(req, res) {
        try {
            const { name, activityType, isTeam } = req.body;
            
            if (!name) {
                return res.status(400).json({ status: false, message: 'Activity name is required' });
            }
            if (!activityType) {
                return res.status(400).json({ status: false, message: 'Activity Type is required' });
            }

            // Check for duplicate
            const existing = await db.queryOne(
                `SELECT id FROM sport_activities WHERE name = ? AND activityType = ? AND deletedAt IS NULL`,
                [name.trim(), activityType]
            );
            
            if (existing) {
                return res.status(409).json({ status: false, message: 'Activity already exists' });
            }

            const isTeamValue = (isTeam === '1' || isTeam === 1 || isTeam === true || isTeam === 'true') ? '1' : '0';
            
            const sql = `INSERT INTO sport_activities (name, activityType, isTeam, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, SYSDATETIME(), SYSDATETIME())`;
            await db.query(sql, [name.trim(), activityType, isTeamValue, '1']);
            
            return res.json({ 
                status: true, 
                message: 'Event Activity created successfully'
            });
        } catch (error) {
            console.error('Error in store Event Activity:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { name, activityType, isTeam } = req.body;
            const activityId = req.params.id;

            if (!name) {
                return res.status(400).json({ status: false, message: 'Activity name is required' });
            }
            if (!activityType) {
                return res.status(400).json({ status: false, message: 'Activity Type is required' });
            }

            // Check for duplicate (excluding current record)
            const existing = await db.queryOne(
                `SELECT id FROM sport_activities WHERE name = ? AND activityType = ? AND id != ? AND deletedAt IS NULL`,
                [name.trim(), activityType, activityId]
            );
            
            if (existing) {
                return res.status(409).json({ status: false, message: 'Activity already exists' });
            }

            const isTeamValue = (isTeam === '1' || isTeam === 1 || isTeam === true || isTeam === 'true') ? '1' : '0';
            
            // Only update status if provided
            let sql, params;
            if (req.body.status !== undefined) {
                sql = `UPDATE sport_activities SET name = ?, activityType = ?, isTeam = ?, status = ?, updatedAt = SYSDATETIME() WHERE id = ?`;
                params = [name.trim(), activityType, isTeamValue, req.body.status, activityId];
            } else {
                sql = `UPDATE sport_activities SET name = ?, activityType = ?, isTeam = ?, updatedAt = SYSDATETIME() WHERE id = ?`;
                params = [name.trim(), activityType, isTeamValue, activityId];
            }

            await db.query(sql, params);
            return res.json({ status: true, message: 'Event Activity updated successfully' });
        } catch (error) {
            console.error('Error in update Event Activity:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const activityId = req.params.id;
            await db.query(`UPDATE sport_activities SET deletedAt = SYSDATETIME() WHERE id = ?`, [activityId]);
            return res.json({ status: true, message: 'Event Activity deleted successfully' });
        } catch (error) {
            console.error('Error in delete Event Activity:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async getActivityTypes(req, res) {
        try {
            const activityTypes = await db.query(`SELECT id, name FROM activity_types WHERE status = '1' AND deletedAt IS NULL ORDER BY name`);
            return res.json({
                status: true,
                data: activityTypes
            });
        } catch (error) {
            console.error('Error fetching activity types:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = EventActivityController;
