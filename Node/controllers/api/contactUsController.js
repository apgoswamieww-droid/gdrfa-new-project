const db = require('../../config/dbDirect');
const responseFormatter = require('../../middlewares/responseFormatter');
const { getLocalizedMessage } = require('../../utils/apiLanguageHelper');
const { storeNotification } = require('../../utils/notificationHelper');
require('dotenv').config();

class ContactUsController {

    // POST /api/contact-us/store
    static async contactStore(req, res) {
        try {
            const { name, email, phone, message } = req.body;

            // Validate required fields
            if (!name || !email || !phone || !message) {
                return res.error(getLocalizedMessage(req, 'All fields are required'));
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.error(getLocalizedMessage(req, 'Invalid email format'));
            }

            // Insert contact message using direct SQL
            await db.query(
                `INSERT INTO contacts (name, email, phone, message, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, SYSDATETIME(), SYSDATETIME())`,
                [name, email, phone, message]
            );

            // Fetch the inserted record
            const contact = await db.queryOne(
                `SELECT id, name, phone, email, message, createdAt, updatedAt, deletedAt 
                 FROM contacts 
                 WHERE email = ? AND name = ? 
                 ORDER BY createdAt DESC`,
                [email, name]
            );

            // Get admin userDomains for sending notification
            const adminUsers = await db.query(
                `SELECT DISTINCT userDomain FROM admin_activity_map WHERE userDomain IS NOT NULL`
            );
            if (adminUsers && adminUsers.length > 0) {
                for (const admin of adminUsers) {
                    await storeNotification({
                        userId: admin.userDomain,
                        title_en: 'New Contact Message',
                        title_ar: 'رسالة اتصال جديدة',
                        message_en: `${name} (${email}) sent a message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
                        message_ar: `${name} (${email}) أرسل رسالة: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
                    });
                }
            }

            // Format datetime to match old response format
            const formatDateTime = (date) => {
                if (!date) return null;
                if (typeof date === 'string') return date;
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = String(d.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };

            const formattedContact = {
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                message: contact.message,
                updatedAt: formatDateTime(contact.updatedAt),
                createdAt: formatDateTime(contact.createdAt),
                deletedAt: contact.deletedAt
            };

            return res.success(
                { contact: formattedContact },
                getLocalizedMessage(req, 'Thanks for contacting us! We will respond as soon as possible.')
            );
        } catch (error) {
            console.error('Error storing contact message:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }
}

module.exports = ContactUsController;
