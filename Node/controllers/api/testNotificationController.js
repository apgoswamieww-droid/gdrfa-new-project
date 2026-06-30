const PushNotificationUtil = require('../../utils/PushNotificationUtil');
const User = require('../../models/User');
const { validationResult } = require('express-validator');

/**
 * Test controller for push notifications using PushNotificationUtil
 */
class TestNotificationController {

    /**
     * Test sending notification to a single user
     */
    static async testSingleUser(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { userId, title, body, titleAr, bodyAr, data } = req.body;

            const result = await PushNotificationUtil.sendToUser({
                userId: parseInt(userId),
                title: title || 'Test Notification',
                body: body || 'This is a test notification from GDRFA backend',
                titleAr: titleAr || 'إشعار تجريبي',
                bodyAr: bodyAr || 'هذا إشعار تجريبي من الخلفية GDRFA',
                data: data || { type: 'test', timestamp: new Date().toISOString() },
                saveToDb: true
            });

            return res.json({
                success: true,
                message: 'Test notification sent to single user',
                result: result
            });

        } catch (error) {
            console.error('Error in testSingleUser:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send test notification',
                error: error.message
            });
        }
    }

    /**
     * Test sending notification to multiple users
     */
    static async testMultipleUsers(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { userIds, title, body, titleAr, bodyAr, data } = req.body;

            const result = await PushNotificationUtil.sendToUsers({
                userIds: userIds.map(id => parseInt(id)),
                title: title || 'Bulk Test Notification',
                body: body || 'This is a bulk test notification from GDRFA backend',
                titleAr: titleAr || 'إشعار جماعي تجريبي',
                bodyAr: bodyAr || 'هذا إشعار جماعي تجريبي من الخلفية GDRFA',
                data: data || { type: 'bulk_test', timestamp: new Date().toISOString() },
                saveToDb: true
            });

            return res.json({
                success: true,
                message: 'Test notification sent to multiple users',
                result: result
            });

        } catch (error) {
            console.error('Error in testMultipleUsers:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send bulk test notification',
                error: error.message
            });
        }
    }

    /**
     * Test sending notification to users by role
     */
    static async testByRole(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { roleNames, title, body, titleAr, bodyAr, data } = req.body;

            const result = await PushNotificationUtil.sendToRole({
                roleNames: roleNames,
                title: title || 'Role-based Test Notification',
                body: body || 'This is a role-based test notification from GDRFA backend',
                titleAr: titleAr || 'إشعار تجريبي حسب الدور',
                bodyAr: bodyAr || 'هذا إشعار تجريبي حسب الدور من الخلفية GDRFA',
                data: data || { type: 'role_test', roles: roleNames, timestamp: new Date().toISOString() },
                saveToDb: true
            });

            return res.json({
                success: true,
                message: `Test notification sent to roles: ${roleNames.join(', ')}`,
                result: result
            });

        } catch (error) {
            console.error('Error in testByRole:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send role-based test notification',
                error: error.message
            });
        }
    }

    /**
     * Test broadcast notification
     */
    static async testBroadcast(req, res) {
        try {
            const { title, body, titleAr, bodyAr, data } = req.body;

            const result = await PushNotificationUtil.sendBroadcast({
                title: title || 'Broadcast Test Notification',
                body: body || 'This is a broadcast test notification from GDRFA backend',
                titleAr: titleAr || 'إشعار بث تجريبي',
                bodyAr: bodyAr || 'هذا إشعار بث تجريبي من الخلفية GDRFA',
                data: data || { type: 'broadcast_test', timestamp: new Date().toISOString() },
                saveToDb: true
            });

            return res.json({
                success: true,
                message: 'Broadcast test notification sent to all users',
                result: result
            });

        } catch (error) {
            console.error('Error in testBroadcast:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send broadcast test notification',
                error: error.message
            });
        }
    }

    /**
     * Test event notification
     */
    static async testEventNotification(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { userIds, eventId, notificationType, additionalData } = req.body;

            // Mock event object for testing (in real scenario, fetch from database)
            const mockEvent = {
                id: eventId || 1,
                name: 'Test Football Tournament 2025',
                start_date: '2025-11-15',
                location: 'GDRFA Sports Complex',
                description: 'Annual football tournament'
            };

            const result = await PushNotificationUtil.sendEventNotification({
                event: mockEvent,
                userIds: userIds.map(id => parseInt(id)),
                type: notificationType || 'assignment',
                additionalData: additionalData || {
                    location: mockEvent.location,
                    startDate: mockEvent.start_date
                },
                saveToDb: true
            });

            return res.json({
                success: true,
                message: `Event ${notificationType || 'assignment'} notification sent`,
                result: result
            });

        } catch (error) {
            console.error('Error in testEventNotification:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send event test notification',
                error: error.message
            });
        }
    }

    /**
     * Test team notification
     */
    static async testTeamNotification(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { userIds, teamId, notificationType, additionalData } = req.body;

            // Mock team object for testing (in real scenario, fetch from database)
            const mockTeam = {
                id: teamId || 1,
                name: 'Test Eagles Football Team',
                captain_id: userIds[0] || 1,
                sport: 'Football'
            };

            const result = await PushNotificationUtil.sendTeamNotification({
                team: mockTeam,
                userIds: userIds.map(id => parseInt(id)),
                type: notificationType || 'assignment',
                additionalData: additionalData || {
                    captainId: mockTeam.captain_id,
                    sport: mockTeam.sport
                },
                saveToDb: true
            });

            return res.json({
                success: true,
                message: `Team ${notificationType || 'assignment'} notification sent`,
                result: result
            });

        } catch (error) {
            console.error('Error in testTeamNotification:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send team test notification',
                error: error.message
            });
        }
    }

    /**
     * Get users with FCM tokens for testing
     */
    static async getUsersWithTokens(req, res) {
        try {
            // const users = await User.findAll({
            //     where: {
            //         fcm_token: { [require('sequelize').Op.not]: null }
            //     },
            //     attributes: ['id', 'name', 'email', 'fcm_token', 'role_id'],
            //     limit: 20
            // });

            // return res.json({
            //     success: true,
            //     message: 'Users with FCM tokens retrieved',
            //     users: users.map(user => ({
            //         id: user.id,
            //         name: user.name,
            //         email: user.email,
            //         hasToken: !!user.fcm_token,
            //         role_id: user.role_id
            //     }))
            // });

        } catch (error) {
            console.error('Error in getUsersWithTokens:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get users with tokens',
                error: error.message
            });
        }
    }

    /**
     * Quick test with current user
     */
    static async testCurrentUser(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            const result = await PushNotificationUtil.sendToUser({
                userId: userId,
                title: 'Test Notification for You!',
                body: 'This is a test notification sent to your account',
                titleAr: 'إشعار تجريبي لك!',
                bodyAr: 'هذا إشعار تجريبي تم إرساله إلى حسابك',
                data: {
                    type: 'self_test',
                    userId: userId.toString(),
                    timestamp: new Date().toISOString()
                },
                saveToDb: true
            });

            return res.json({
                success: true,
                message: 'Test notification sent to your account',
                result: result
            });

        } catch (error) {
            console.error('Error in testCurrentUser:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send test notification to current user',
                error: error.message
            });
        }
    }
}

module.exports = TestNotificationController;
