const db = require('../config/dbDirect');

/**
 * Store a notification for a user
 * 
 * @param {Object} params 
 * @param {string} params.userId - Target user ID (userDomain string)
 * @param {string} params.title_en - Notification title (English)
 * @param {string} params.title_ar - Notification title (Arabic)
 * @param {string} params.message_en - Notification message (English)
 * @param {string} params.message_ar - Notification message (Arabic)
 * @param {string} [params.status='1'] - Notification status (1=active,0=inactive)
 * @returns {Promise<Object>} Created notification
 */
async function storeNotification({
    userId,
    title_en,
    title_ar,
    message_en,
    message_ar,
    status = '1'
}) {
    try {
        if (!userId) throw new Error('userId is required');

        const result = await db.query(
            `INSERT INTO notifications (userId, title_en, title_ar, message_en, message_ar, isRead, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, 0, ?, GETDATE(), GETDATE())`,
            [userId, title_en, title_ar, message_en, message_ar, status]
        );

        return result;
    } catch (error) {
        console.error('Error storing notification:', error.message);
        throw error;
    }
}

module.exports = { storeNotification };
