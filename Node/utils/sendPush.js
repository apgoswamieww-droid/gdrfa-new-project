
const { getMessaging } = require("../config/firebase");

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    try {
        const messaging = getMessaging();
        
        if (!messaging) {
            console.warn('Firebase messaging not initialized. Push notification skipped.');
            return { success: false, error: 'Firebase not initialized' };
        }

        if (!fcmToken || fcmToken.trim() === '') {
            console.warn('FCM token not provided. Push notification skipped.');
            return { success: false, error: 'FCM token not provided' };
        }

        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                ...data,
                timestamp: new Date().toISOString(),
            },
            token: fcmToken,
        };

        const response = await messaging.send(message);
        // console.log('Successfully sent push notification:', response);
        
        return { success: true, response };

    } catch (error) {
        console.error('Error sending push notification:', error);
        
        // Handle specific FCM errors
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
            // console.log('Invalid FCM token detected');
            return { success: false, error: 'INVALID_TOKEN', message: error.message };
        }
        
        return { success: false, error: error.message };
    }
};

module.exports = { 
    sendPushNotification
};
