const db = require('../../config/dbDirect');
const responseFormatter = require('../../middlewares/responseFormatter');
const { getLocalizedMessage } = require('../../utils/apiLanguageHelper');
require('dotenv').config();

class NotificationController {

    // GET /api/notifications/all
    static async getAllNotification(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const lang = req.headers['accept-language'] || 'en';
            const isArabic = lang.includes('ar');
            const type = req.query.type || 'unread'; // 'unread' or 'all'

            let whereClause = 'userId = ? AND deletedAt IS NULL';
            const params = [userId];

            if (type === 'unread') {
                whereClause += ' AND isRead = 0';
            }

            // Count total
            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`,
                params
            );

            const total = countResult.total || 0;

            // Fetch paginated notifications
            const notifications = await db.query(
                `SELECT id, title_en, title_ar, message_en, message_ar, isRead, status, createdAt, updatedAt
                 FROM notifications 
                 WHERE ${whereClause}
                 ORDER BY createdAt DESC
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, offset, parseInt(limit)]
            );

            const formattedNotifications = (notifications || []).map(notif => ({
                id: notif.id,
                title_en: notif.title_en,
                title_ar: notif.title_ar,
                message_en: notif.message_en,
                message_ar: notif.message_ar,
                title: isArabic ? notif.title_ar : notif.title_en,
                message: isArabic ? notif.message_ar : notif.message_en,
                isRead: notif.isRead,
                status: notif.status,
                createdAt: notif.createdAt,
                updatedAt: notif.updatedAt
            }));

            return res.success(
                {
                    notifications: formattedNotifications,
                    pagination: {
                        total: total,
                        page: page,
                        limit: limit,
                        totalPages: Math.ceil(total / limit)
                    }
                },
                getLocalizedMessage(req, 'Notifications retrieved successfully.')
            );
        } catch (error) {
            console.error('Error fetching notifications:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // DELETE /api/notifications/clear-all
    static async clearAllNotifications(req, res) {
        try {
            const userId = req.user.id;

            // Soft delete all notifications
            await db.query(
                `UPDATE notifications SET deletedAt = GETDATE(), updatedAt = GETDATE() WHERE userId = ? AND deletedAt IS NULL`,
                [userId]
            );

            return res.success({}, getLocalizedMessage(req, 'All notifications cleared successfully'));
        } catch (error) {
            console.error('Error clearing notifications:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // DELETE /api/notifications/clear/:id
    static async clearNotificationById(req, res) {
        try {
            const userId = req.user.id;
            const notificationId = req.params.id ? req.params.id.toString() : null;

            if (!notificationId) {
                return res.error(getLocalizedMessage(req, 'Notification ID is required'));
            }

            // Check if notification belongs to user
            const notification = await db.queryOne(
                `SELECT id FROM notifications WHERE id = CAST(? AS INT) AND userId = ? AND deletedAt IS NULL`,
                [notificationId, userId]
            );

            if (!notification) {
                return res.error(getLocalizedMessage(req, 'Notification not found'));
            }

            // Soft delete notification
            await db.query(
                `UPDATE notifications SET deletedAt = GETDATE(), updatedAt = GETDATE() WHERE id = CAST(? AS INT)`,
                [notificationId]
            );

            return res.success({}, getLocalizedMessage(req, 'Notification cleared successfully'));
        } catch (error) {
            console.error('Error clearing notification:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // POST /api/notifications/fcm-token
    static async updateFCMToken(req, res) {
        try {
            const userId = req.user.id;
            const { token } = req.body;

            if (!token) {
                return res.error(getLocalizedMessage(req, 'FCM token is required'));
            }

            // Update user FCM token
            await db.query(
                `UPDATE users SET fcm_token = ? WHERE id = ?`,
                [token, userId]
            );

            return res.success({}, getLocalizedMessage(req, 'FCM token updated successfully'));
        } catch (error) {
            console.error('Error updating FCM token:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // DELETE /api/notifications/remove-fcm-token
    static async removeFCMToken(req, res) {
        try {
            const userId = req.user.id;

            // Remove FCM token
            await db.query(
                `UPDATE users SET fcm_token = NULL WHERE id = ?`,
                [userId]
            );

            return res.success({}, getLocalizedMessage(req, 'FCM token removed successfully'));
        } catch (error) {
            console.error('Error removing FCM token:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // POST /api/notifications/test
    static async testPushNotification(req, res) {
        try {
            const userId = req.user.id;

            // Create test notification
            await db.query(
                `INSERT INTO notifications (userId, title_en, title_ar, message_en, message_ar, isRead, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, 0, '1', GETDATE(), GETDATE())`,
                [userId, 'Test Notification', 'إشعار اختبار', 'This is a test notification from the platform', 'هذا إشعار اختبار من المنصة']
            );

            return res.success({}, getLocalizedMessage(req, 'Test notification sent successfully'));
        } catch (error) {
            console.error('Error sending test notification:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // PUT /api/notifications/mark-as-read/:id
    static async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const notificationId = req.params.id ? req.params.id.toString() : null;

            if (!notificationId) {
                return res.error(getLocalizedMessage(req, 'Notification ID is required'));
            }

            // Check if notification belongs to user
            const notification = await db.queryOne(
                `SELECT id FROM notifications WHERE id = CAST(? AS INT) AND userId = ? AND deletedAt IS NULL`,
                [notificationId, userId]
            );

            if (!notification) {
                return res.error(getLocalizedMessage(req, 'Notification not found'));
            }

            // Mark as read
            await db.query(
                `UPDATE notifications SET isRead = 1, updatedAt = GETDATE() WHERE id = CAST(? AS INT)`,
                [notificationId]
            );

            return res.success({}, getLocalizedMessage(req, 'Notification marked as read'));
        } catch (error) {
            console.error('Error marking notification as read:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // GET /api/notifications/unread-count
    static async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;

            const result = await db.queryOne(
                `SELECT COUNT(*) as unreadCount FROM notifications WHERE userId = ? AND isRead = 0 AND deletedAt IS NULL`,
                [userId]
            );

            return res.success(
                { unreadCount: result?.unreadCount || 0 },
                getLocalizedMessage(req, 'Unread count fetched successfully')
            );
        } catch (error) {
            console.error('Error fetching unread count:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }
}

module.exports = NotificationController;
