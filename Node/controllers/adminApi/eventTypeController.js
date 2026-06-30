const db = require('../../config/dbDirect');

// This controller uses activity_types table for Event Types module
// Using raw SQL queries for MSSQL compatibility

class EventTypeController {
    static async list(req, res) {
        try {
            const eventTypes = await db.query(`SELECT id, name, status, createdAt FROM activity_types WHERE deletedAt IS NULL ORDER BY createdAt DESC`);
            return res.json({
                status: true,
                message: 'Event Types retrieved successfully',
                data: {
                    data: eventTypes,
                    total: eventTypes.length
                }
            });
        } catch (error) {
            console.error('Error in list Event Types:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async store(req, res) {
        try {
            const { name, status } = req.body;
            if (!name) {
                return res.status(400).json({ status: false, message: 'Event Type name is required' });
            }

            // Check for duplicate
            const existing = await db.queryOne(`SELECT id FROM activity_types WHERE name = ? AND deletedAt IS NULL`, [name.trim()]);
            if (existing) {
                return res.status(409).json({ status: false, message: 'Event Type name already exists' });
            }

            const sql = `INSERT INTO activity_types (name, status, createdAt, updatedAt) VALUES (?, ?, SYSDATETIME(), SYSDATETIME())`;
            await db.query(sql, [name.trim(), status || '1']);
            
            return res.json({ 
                status: true, 
                message: 'Event Type created successfully'
            });
        } catch (error) {
            console.error('Error in store Event Type:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { name, status } = req.body;
            const eventTypeId = req.params.id;

            if (!name) {
                return res.status(400).json({ status: false, message: 'Event Type name is required' });
            }

            // Check for duplicate (excluding current record)
            const existing = await db.queryOne(
                `SELECT id FROM activity_types WHERE name = ? AND id != ? AND deletedAt IS NULL`, 
                [name.trim(), eventTypeId]
            );
            if (existing) {
                return res.status(409).json({ status: false, message: 'Event Type name already exists' });
            }

            // Only update status if provided
            let sql, params;
            if (status !== undefined) {
                sql = `UPDATE activity_types SET name = ?, status = ?, updatedAt = SYSDATETIME() WHERE id = ?`;
                params = [name.trim(), status, eventTypeId];
            } else {
                sql = `UPDATE activity_types SET name = ?, updatedAt = SYSDATETIME() WHERE id = ?`;
                params = [name.trim(), eventTypeId];
            }

            await db.query(sql, params);
            return res.json({ status: true, message: 'Event Type updated successfully' });
        } catch (error) {
            console.error('Error in update Event Type:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const eventTypeId = req.params.id;
            await db.query(`UPDATE activity_types SET deletedAt = SYSDATETIME() WHERE id = ?`, [eventTypeId]);
            return res.json({ status: true, message: 'Event Type deleted successfully' });
        } catch (error) {
            console.error('Error in delete Event Type:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = EventTypeController;
