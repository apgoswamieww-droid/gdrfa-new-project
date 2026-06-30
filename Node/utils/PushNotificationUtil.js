const { sendPushNotification, sendBulkPushNotifications } = require('./sendPush');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');

/**
 * Common utility function for sending web push notifications
 * Handles single user, multiple users, role-based, and broadcast notifications
 */
class PushNotificationUtil {

    /**
     * Send push notification to a single user
     * @param {Object} options - Notification options
     * @param {number} options.userId - User ID to send notification to
     * @param {string} options.title - Notification title
     * @param {string} options.body - Notification body
     * @param {Object} options.data - Additional data (optional)
     * @param {boolean} options.saveToDb - Save notification to database (default: true)
     * @param {string} options.titleAr - Arabic title (optional)
     * @param {string} options.bodyAr - Arabic body (optional)
     * @returns {Promise<Object>} Result object
     */
    static async sendToUser({ userId, title, body, data = {}, saveToDb = true, titleAr = null, bodyAr = null }) {
        try {
            if (!userId || !title || !body) {
                return { success: false, error: 'userId, title, and body are required' };
            }

            // Get user with FCM token
            const user = await User.findByPk(userId, {
                attributes: ['id', 'name', 'email', 'fcm_token']
            });

            if (!user) {
                return { success: false, error: 'User not found' };
            }

            if (!user.fcm_token) {
                console.warn(`No FCM token found for user ${userId}`);
                return { success: false, error: 'No FCM token found for user' };
            }

            // Send push notification
            const result = await sendPushNotification(
                user.fcm_token,
                title,
                body,
                {
                    ...data,
                    userId: userId.toString(),
                    type: data.type || 'general'
                },
                userId,
                saveToDb
            );

            // Handle invalid token
            if (result && result.error === 'INVALID_TOKEN') {
                await User.update(
                    { fcm_token: null },
                    { where: { id: userId } }
                );
                return { success: false, error: 'Invalid FCM token removed' };
            }

            // Save to database if requested and not already saved by sendPushNotification
            if (saveToDb && result.success) {
                try {
                    await Notification.create({
                        userId: userId,
                        title_en: title,
                        title_ar: titleAr || title,
                        message_en: body,
                        message_ar: bodyAr || body,
                        isRead: false,
                        status: '1'
                    });
                } catch (dbError) {
                    console.error('Error saving notification to database:', dbError);
                }
            }

            return {
                success: result.success,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                result: result
            };

        } catch (error) {
            console.error('Error in sendToUser:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send push notification to multiple users
     * @param {Object} options - Notification options
     * @param {Array<number>} options.userIds - Array of user IDs
     * @param {string} options.title - Notification title
     * @param {string} options.body - Notification body
     * @param {Object} options.data - Additional data (optional)
     * @param {boolean} options.saveToDb - Save notifications to database (default: true)
     * @param {string} options.titleAr - Arabic title (optional)
     * @param {string} options.bodyAr - Arabic body (optional)
     * @returns {Promise<Object>} Result object
     */
    static async sendToUsers({ userIds, title, body, data = {}, saveToDb = true, titleAr = null, bodyAr = null }) {
        try {
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return { success: false, error: 'userIds array is required' };
            }

            if (!title || !body) {
                return { success: false, error: 'title and body are required' };
            }

            // Get users with FCM tokens
            const users = await User.findAll({
                where: {
                    id: { [Op.in]: userIds },
                    fcm_token: { [Op.not]: null }
                },
                attributes: ['id', 'name', 'email', 'fcm_token']
            });

            if (users.length === 0) {
                return { success: false, error: 'No users with FCM tokens found' };
            }

            const tokens = users.map(user => user.fcm_token);
            const results = {
                totalUsers: userIds.length,
                usersWithTokens: users.length,
                sent: 0,
                failed: 0,
                invalidTokens: []
            };

            // Send bulk push notifications
            const pushResult = await sendBulkPushNotifications(
                tokens,
                title,
                body,
                {
                    ...data,
                    type: data.type || 'general'
                }
            );

            if (pushResult && pushResult.success) {
                results.sent = pushResult.result.successCount || 0;
                results.failed = pushResult.result.failureCount || 0;

                // Handle failed tokens
                if (pushResult.result.responses) {
                    for (let i = 0; i < pushResult.result.responses.length; i++) {
                        const response = pushResult.result.responses[i];
                        if (!response.success && response.error) {
                            const user = users[i];
                            results.invalidTokens.push(user.id);
                            
                            // Remove invalid token
                            await User.update(
                                { fcm_token: null },
                                { where: { id: user.id } }
                            );
                        }
                    }
                }
            }

            // Save to database if requested
            if (saveToDb) {
                try {
                    const notifications = users.map(user => ({
                        userId: user.id,
                        title_en: title,
                        title_ar: titleAr || title,
                        message_en: body,
                        message_ar: bodyAr || body,
                        isRead: false,
                        status: '1'
                    }));

                    await Notification.bulkCreate(notifications);
                } catch (dbError) {
                    console.error('Error saving bulk notifications to database:', dbError);
                }
            }

            return {
                success: true,
                results,
                users: users.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.email
                }))
            };

        } catch (error) {
            console.error('Error in sendToUsers:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send push notification to users by role
     * @param {Object} options - Notification options
     * @param {Array<string>} options.roleNames - Array of role names
     * @param {string} options.title - Notification title
     * @param {string} options.body - Notification body
     * @param {Object} options.data - Additional data (optional)
     * @param {boolean} options.saveToDb - Save notifications to database (default: true)
     * @param {string} options.titleAr - Arabic title (optional)
     * @param {string} options.bodyAr - Arabic body (optional)
     * @returns {Promise<Object>} Result object
     */
    static async sendToRole({ roleNames, title, body, data = {}, saveToDb = true, titleAr = null, bodyAr = null }) {
        try {
            if (!roleNames || !Array.isArray(roleNames) || roleNames.length === 0) {
                return { success: false, error: 'roleNames array is required' };
            }

            const Role = require('../models/Role');

            // Get users by role
            const users = await User.findAll({
                include: [{
                    model: Role,
                    as: 'roleData',
                    where: {
                        name: { [Op.in]: roleNames }
                    }
                }],
                where: {
                    status: '1',
                    fcm_token: { [Op.not]: null }
                },
                attributes: ['id', 'name', 'email', 'fcm_token']
            });

            if (users.length === 0) {
                return { success: false, error: `No users found with roles: ${roleNames.join(', ')}` };
            }

            const userIds = users.map(user => user.id);

            return await this.sendToUsers({
                userIds,
                title,
                body,
                data: {
                    ...data,
                    targetRoles: roleNames
                },
                saveToDb,
                titleAr,
                bodyAr
            });

        } catch (error) {
            console.error('Error in sendToRole:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send broadcast notification to all active users
     * @param {Object} options - Notification options
     * @param {string} options.title - Notification title
     * @param {string} options.body - Notification body
     * @param {Object} options.data - Additional data (optional)
     * @param {boolean} options.saveToDb - Save notifications to database (default: true)
     * @param {string} options.titleAr - Arabic title (optional)
     * @param {string} options.bodyAr - Arabic body (optional)
     * @returns {Promise<Object>} Result object
     */
    static async sendBroadcast({ title, body, data = {}, saveToDb = true, titleAr = null, bodyAr = null }) {
        try {
            // Get all active users with FCM tokens
            const users = await User.findAll({
                where: {
                    status: '1',
                    fcm_token: { [Op.not]: null }
                },
                attributes: ['id', 'name', 'email', 'fcm_token']
            });

            if (users.length === 0) {
                return { success: false, error: 'No active users with FCM tokens found' };
            }

            const userIds = users.map(user => user.id);

            return await this.sendToUsers({
                userIds,
                title,
                body,
                data: {
                    ...data,
                    type: 'broadcast'
                },
                saveToDb,
                titleAr,
                bodyAr
            });

        } catch (error) {
            console.error('Error in sendBroadcast:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send event-related push notification
     * @param {Object} options - Notification options
     * @param {Object} options.event - Event object
     * @param {Array<number>} options.userIds - Array of user IDs
     * @param {string} options.type - Notification type (assignment, update, reminder, etc.)
     * @param {Object} options.additionalData - Additional data (optional)
     * @param {boolean} options.saveToDb - Save notifications to database (default: true)
     * @returns {Promise<Object>} Result object
     */
    static async sendEventNotification({ event, userIds, type = 'assignment', additionalData = {}, saveToDb = true }) {
        try {
            if (!event || !userIds || !Array.isArray(userIds)) {
                return { success: false, error: 'event and userIds are required' };
            }

            let title, body, titleAr, bodyAr;

            // Determine notification content based on type
            switch (type) {
                case 'assignment':
                    title = `Event Assignment: ${event.name}`;
                    body = `You have been assigned to participate in ${event.name}`;
                    titleAr = `تعيين فعالية: ${event.name}`;
                    bodyAr = `تم تعيينك للمشاركة في ${event.name}`;
                    break;
                case 'update':
                    title = `Event Update: ${event.name}`;
                    body = `Event ${event.name} has been updated`;
                    titleAr = `تحديث الفعالية: ${event.name}`;
                    bodyAr = `تم تحديث الفعالية ${event.name}`;
                    break;
                case 'reminder':
                    title = `Event Reminder: ${event.name}`;
                    body = `Don't forget about ${event.name} happening soon`;
                    titleAr = `تذكير الفعالية: ${event.name}`;
                    bodyAr = `لا تنس ${event.name} التي ستحدث قريباً`;
                    break;
                case 'completion':
                    title = `Event Completed: ${event.name}`;
                    body = `Event ${event.name} has been completed successfully`;
                    titleAr = `اكتملت الفعالية: ${event.name}`;
                    bodyAr = `تم إنجاز الفعالية ${event.name} بنجاح`;
                    break;
                default:
                    title = `Event Notification: ${event.name}`;
                    body = `You have a notification about ${event.name}`;
                    titleAr = `إشعار الفعالية: ${event.name}`;
                    bodyAr = `لديك إشعار حول ${event.name}`;
            }

            return await this.sendToUsers({
                userIds,
                title,
                body,
                titleAr,
                bodyAr,
                data: {
                    eventId: event.id.toString(),
                    eventName: event.name,
                    type: type,
                    ...additionalData
                },
                saveToDb
            });

        } catch (error) {
            console.error('Error in sendEventNotification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send team-related push notification
     * @param {Object} options - Notification options
     * @param {Object} options.team - Team object
     * @param {Array<number>} options.userIds - Array of user IDs
     * @param {string} options.type - Notification type (assignment, update, etc.)
     * @param {Object} options.additionalData - Additional data (optional)
     * @param {boolean} options.saveToDb - Save notifications to database (default: true)
     * @returns {Promise<Object>} Result object
     */
    static async sendTeamNotification({ team, userIds, type = 'assignment', additionalData = {}, saveToDb = true }) {
        try {
            if (!team || !userIds || !Array.isArray(userIds)) {
                return { success: false, error: 'team and userIds are required' };
            }

            let title, body, titleAr, bodyAr;

            switch (type) {
                case 'assignment':
                    title = `Team Assignment: ${team.name}`;
                    body = `You have been assigned to team ${team.name}`;
                    titleAr = `تعيين الفريق: ${team.name}`;
                    bodyAr = `تم تعيينك في الفريق ${team.name}`;
                    break;
                case 'captain':
                    title = `Team Captain: ${team.name}`;
                    body = `You have been made captain of team ${team.name}`;
                    titleAr = `قائد الفريق: ${team.name}`;
                    bodyAr = `تم تعيينك كقائد للفريق ${team.name}`;
                    break;
                default:
                    title = `Team Notification: ${team.name}`;
                    body = `You have a notification about team ${team.name}`;
                    titleAr = `إشعار الفريق: ${team.name}`;
                    bodyAr = `لديك إشعار حول الفريق ${team.name}`;
            }

            return await this.sendToUsers({
                userIds,
                title,
                body,
                titleAr,
                bodyAr,
                data: {
                    teamId: team.id.toString(),
                    teamName: team.name,
                    type: type,
                    ...additionalData
                },
                saveToDb
            });

        } catch (error) {
            console.error('Error in sendTeamNotification:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = PushNotificationUtil;