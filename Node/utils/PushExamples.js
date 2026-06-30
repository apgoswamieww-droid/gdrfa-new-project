/**
 * Example usage of PushNotificationUtil
 * This file demonstrates how to use the common push notification utility
 */

const PushNotificationUtil = require('./PushNotificationUtil');

// Example usage functions
class PushExamples {

    /**
     * Example 1: Send notification to a single user
     */
    static async sendToSingleUser() {
        try {
            const result = await PushNotificationUtil.sendToUser({
                userId: 123,
                title: 'Welcome!',
                body: 'Welcome to GDRFA Sports App',
                titleAr: 'مرحباً!',
                bodyAr: 'مرحباً بك في تطبيق الرياضة GDRFA',
                data: {
                    type: 'welcome',
                    screen: 'dashboard'
                },
                saveToDb: true
            });

            // console.log('Single user notification result:', result);
            return result;
        } catch (error) {
            console.error('Error sending to single user:', error);
        }
    }

    /**
     * Example 2: Send notification to multiple users
     */
    static async sendToMultipleUsers() {
        try {
            const result = await PushNotificationUtil.sendToUsers({
                userIds: [123, 456, 789],
                title: 'New Feature Available',
                body: 'Check out our new sports tracking feature!',
                titleAr: 'ميزة جديدة متاحة',
                bodyAr: 'تحقق من ميزة تتبع الرياضة الجديدة!',
                data: {
                    type: 'feature',
                    feature: 'sports_tracking'
                }
            });

            // console.log('Multiple users notification result:', result);
            return result;
        } catch (error) {
            console.error('Error sending to multiple users:', error);
        }
    }

    /**
     * Example 3: Send notification to users by role
     */
    static async sendToUsersByRole() {
        try {
            const result = await PushNotificationUtil.sendToRole({
                roleNames: ['manager', 'admin'],
                title: 'New Report Available',
                body: 'Monthly sports activity report is ready',
                titleAr: 'تقرير جديد متاح',
                bodyAr: 'تقرير النشاط الرياضي الشهري جاهز',
                data: {
                    type: 'report',
                    reportType: 'monthly'
                }
            });

            // console.log('Role-based notification result:', result);
            return result;
        } catch (error) {
            console.error('Error sending to role:', error);
        }
    }

    /**
     * Example 4: Send broadcast notification
     */
    static async sendBroadcast() {
        try {
            const result = await PushNotificationUtil.sendBroadcast({
                title: 'System Maintenance',
                body: 'The system will undergo maintenance tonight',
                titleAr: 'صيانة النظام',
                bodyAr: 'سيخضع النظام للصيانة الليلة',
                data: {
                    type: 'maintenance',
                    priority: 'high'
                }
            });

            // console.log('Broadcast notification result:', result);
            return result;
        } catch (error) {
            console.error('Error sending broadcast:', error);
        }
    }

    /**
     * Example 5: Send event notification
     */
    static async sendEventNotification() {
        try {
            // Mock event object
            const event = {
                id: 1,
                name: 'Football Tournament 2025',
                start_date: '2025-03-15',
                location: 'GDRFA Sports Complex'
            };

            const result = await PushNotificationUtil.sendEventNotification({
                event: event,
                userIds: [123, 456],
                type: 'assignment',
                additionalData: {
                    location: event.location,
                    startDate: event.start_date
                }
            });

            // console.log('Event notification result:', result);
            return result;
        } catch (error) {
            console.error('Error sending event notification:', error);
        }
    }

    /**
     * Example 6: Send team notification
     */
    static async sendTeamNotification() {
        try {
            // Mock team object
            const team = {
                id: 1,
                name: 'Eagles Football Team',
                captain_id: 123
            };

            const result = await PushNotificationUtil.sendTeamNotification({
                team: team,
                userIds: [456, 789],
                type: 'assignment',
                additionalData: {
                    captainId: team.captain_id
                }
            });

            // console.log('Team notification result:', result);
            return result;
        } catch (error) {
            console.error('Error sending team notification:', error);
        }
    }

    /**
     * Example 7: Custom notification with minimal parameters
     */
    static async sendSimpleNotification() {
        try {
            const result = await PushNotificationUtil.sendToUser({
                userId: 123,
                title: 'Quick Message',
                body: 'This is a simple notification',
                // titleAr and bodyAr are optional - will use English if not provided
                // data is optional - defaults to empty object
                // saveToDb is optional - defaults to true
            });

            // console.log('Simple notification result:', result);
            return result;
        } catch (error) {
            console.error('Error sending simple notification:', error);
        }
    }
}

// Usage in controllers or services:
/*
// In your controller or service file:
const PushNotificationUtil = require('../utils/PushNotificationUtil');

// Example in event controller when user is assigned to event
exports.assignUserToEvent = async (req, res) => {
    try {
        const { eventId, userId } = req.body;
        
        // Your assignment logic here...
        
        // Send push notification
        const event = await Event.findByPk(eventId);
        if (event) {
            await PushNotificationUtil.sendEventNotification({
                event: event,
                userIds: [userId],
                type: 'assignment'
            });
        }

        res.json({ success: true, message: 'User assigned successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Example in auth controller for welcome notification
exports.login = async (req, res) => {
    try {
        // Your login logic here...
        
        // Send welcome notification for first time login
        if (user.isFirstLogin) {
            await PushNotificationUtil.sendToUser({
                userId: user.id,
                title: 'Welcome to GDRFA Sports!',
                body: 'Start exploring our amazing sports activities',
                titleAr: 'مرحباً بك في رياضة GDRFA!',
                bodyAr: 'ابدأ في استكشاف أنشطتنا الرياضية الرائعة',
                data: {
                    type: 'welcome',
                    screen: 'dashboard'
                }
            });
        }

        res.json({ success: true, user: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
*/

module.exports = PushExamples;