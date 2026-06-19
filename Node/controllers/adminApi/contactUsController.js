const db = require('../../config/dbDirect');

class ContactUsController {
    static async list(req, res) {
        try {
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';

            let whereClause = 'WHERE deletedAt IS NULL';
            const params = [];

            if (search) {
                whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM contacts ${whereClause}`,
                params
            );
            const total = countResult.total || 0;

            const data = await db.query(
                `SELECT * FROM contacts ${whereClause}
                 ORDER BY createdAt DESC
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, start, length]
            );
            return res.json({
                status: true,
                message: 'Contacts retrieved successfully',
                data: { data, total }
            });
        } catch (error) {
            console.error('Error in list contacts:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async show(req, res) {
        try {
            const contactId = req.params.id;
            const contact = await db.queryOne(
                `SELECT * FROM contacts WHERE id = ? AND deletedAt IS NULL`,
                [contactId]
            );

            if (!contact) {
                return res.status(404).json({ status: false, message: 'Contact not found' });
            }

            return res.json({
                status: true,
                message: 'Contact retrieved successfully',
                data: contact
            });
        } catch (error) {
            console.error('Error in show contact:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const contactId = req.params.id;
            const contact = await db.queryOne(
                `SELECT id FROM contacts WHERE id = ?`,
                [contactId]
            );

            if (!contact) {
                return res.status(404).json({ status: false, message: 'Contact not found' });
            }

            await db.query(
                `UPDATE contacts SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
                [contactId]
            );

            return res.json({ status: true, message: 'Contact deleted successfully' });
        } catch (error) {
            console.error('Error in delete contact:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = ContactUsController;
