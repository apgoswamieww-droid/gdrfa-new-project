const db = require('../../config/dbDirect');

class FaqController {
    // ==================== LIST FAQs ====================
    static async list(req, res) {
        try {
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';

            let whereClause = 'WHERE deletedAt IS NULL';
            const params = [];

            if (search) {
                whereClause += ' AND (question LIKE ? OR answer LIKE ? OR question_ar LIKE ? OR answer_ar LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }

            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM faqs ${whereClause}`,
                params
            );
            const total = countResult.total || 0;

            const data = await db.query(
                `SELECT * FROM faqs ${whereClause} 
                 ORDER BY createdAt DESC 
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, start, length]
            );

            return res.json({
                status: true,
                message: 'FAQs retrieved successfully',
                data: {
                    data,
                    total
                }
            });
        } catch (error) {
            console.error('Error in list FAQs:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== CREATE FAQ ====================
    static async store(req, res) {
        try {
            const { question, question_ar, answer, answer_ar } = req.body;
            
            if (!question || !question_ar || !answer || !answer_ar) {
                return res.status(400).json({ status: false, message: 'All bilingual fields (question and answer) are required' });
            }

            await db.query(
                `INSERT INTO faqs (question, question_ar, answer, answer_ar, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, '1', SYSDATETIME(), SYSDATETIME())`,
                [question, question_ar, answer, answer_ar]
            );

            return res.json({ status: true, message: 'FAQ created successfully' });
        } catch (error) {
            console.error('Error in store FAQ:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== UPDATE FAQ ====================
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { question, question_ar, answer, answer_ar } = req.body;

            if (!question || !question_ar || !answer || !answer_ar) {
                return res.status(400).json({ status: false, message: 'All bilingual fields (question and answer) are required' });
            }

            const faq = await db.queryOne('SELECT * FROM faqs WHERE id = ? AND deletedAt IS NULL', [id]);
            if (!faq) {
                return res.status(404).json({ status: false, message: 'FAQ not found' });
            }

            await db.query(
                `UPDATE faqs SET question = ?, question_ar = ?, answer = ?, answer_ar = ?, 
                 updatedAt = SYSDATETIME() WHERE id = ?`,
                [question, question_ar, answer, answer_ar, id]
            );

            return res.json({ status: true, message: 'FAQ updated successfully' });
        } catch (error) {
            console.error('Error in update FAQ:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== DELETE FAQ ====================
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const faq = await db.queryOne('SELECT * FROM faqs WHERE id = ? AND deletedAt IS NULL', [id]);
            
            if (!faq) {
                return res.status(404).json({ status: false, message: 'FAQ not found' });
            }

            await db.query('UPDATE faqs SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?', [id]);

            return res.json({ status: true, message: 'FAQ deleted successfully' });
        } catch (error) {
            console.error('Error in delete FAQ:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== TOGGLE STATUS ====================
    static async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            await db.query('UPDATE faqs SET status = ?, updatedAt = SYSDATETIME() WHERE id = ?', [status, id]);
            return res.json({ status: true, message: 'Status updated successfully' });
        } catch (error) {
            console.error('Error in toggleStatus:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = FaqController;
