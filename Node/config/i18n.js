const path = require('path');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');

// Custom Language Detector
const customDetector = {
    name: 'customDetector',
    lookup(req, res, options) {
        try {
            // Check different sources for language preference
            if (!req || !req.session) {
                return 'en';
            }

            if (req.originalUrl.startsWith('/api')) {
                const acceptLang = req.headers['accept-language']?.split(',')[0] || 'en';
                return acceptLang.startsWith('ar') ? 'ar' : 'en';
            }

            // Try different sources in order of preference
            const lang = req.session?.lng || 
                        req.cookies?.lang ||
                        req.query?.lng ||
                        req.headers['accept-language']?.split(',')[0] ||
                        'en';

            // Normalize language code
            return lang.startsWith('en') ? 'en' : (lang === 'ar' ? 'ar' : 'en');
        } catch (error) {
            console.error('Language detection error:', error);
            return 'en';
        }
    },
    cacheUserLanguage(req, res, lng, options) {
        try {
            if (req && req.session) {
                req.session.lng = lng;
            }
            if (res && res.cookie) {
                res.cookie('lang', lng, {
                    maxAge: 365 * 24 * 60 * 60 * 1000,
                    httpOnly: true
                });
            }
        } catch (error) {
            console.error('Language caching error:', error);
        }
    }
};

// Setup Language Detector
const languageDetector = new middleware.LanguageDetector();
languageDetector.addDetector(customDetector);

// i18next Initialization
i18next
    .use(Backend)
    .use(languageDetector)
    .init({
        fallbackLng: 'en',
        preload: ['en', 'ar'],
        backend: {
            loadPath: path.join(__dirname, '../locales/{{lng}}/translation.json')
        },
        detection: {
            order: ['customDetector'],
            caches: ['session']
        },
        supportedLngs: ['en', 'ar'],
        interpolation: {
            escapeValue: false
        }
    });

// Create custom middleware to add both t and __ functions
const customI18nMiddleware = {
    handle: (i18next) => {
        return (req, res, next) => {
            const handle = middleware.handle(i18next);
            handle(req, res, () => {
                // Add the __ alias for t function
                if (req.t) {
                    req.__ = req.t;
                }
                next();
            });
        };
    }
};

module.exports = { i18next, middleware: customI18nMiddleware };
