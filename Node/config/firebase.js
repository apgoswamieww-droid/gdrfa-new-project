const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

const initializeFirebase = () => {
    if (!firebaseApp) {
        try {
            // Check if service account file exists
            const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
            
            // Try to initialize with service account file first
            try {
                const serviceAccount = require(serviceAccountPath);
                firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id,
                });
                console.log('Firebase initialized with service account file');
            } catch (fileError) {
                // Fallback to environment variables if file doesn't exist
                if (process.env.FIREBASE_PROJECT_ID && 
                    process.env.FIREBASE_PRIVATE_KEY && 
                    process.env.FIREBASE_CLIENT_EMAIL) {
                    
                    firebaseApp = admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        }),
                        projectId: process.env.FIREBASE_PROJECT_ID,
                    });
                    console.log('Firebase initialized with environment variables');
                } else {
                    console.log('Firebase configuration not found. Push notifications will be disabled.');
                    console.log('To enable: Add firebase-service-account.json to config folder OR set FIREBASE_* environment variables');
                    return null;
                }
            }
        } catch (error) {
            console.error('Error initializing Firebase:', error.message);
            return null;
        }
    }
    return firebaseApp;
};

const getFirebaseApp = () => {
    if (!firebaseApp) {
        return initializeFirebase();
    }
    return firebaseApp;
};

const getMessaging = () => {
    const app = getFirebaseApp();
    return app ? admin.messaging() : null;
};

module.exports = {
    initializeFirebase,
    getFirebaseApp,
    getMessaging,
    admin
};