function normalizeLanguage(lang) {
    try {
        if (!lang || (lang !== 'en' && lang !== 'ar')) {
            return 'en';
        }
        return lang;
    } catch (error) {
        return 'en';
    }
}

function getLanguageFromRequest(req) {
    try {
        // For admin routes after login, prioritize session language
        if (req.session && req.session.admin && req.session.lng) {
            return req.session.lng;
        }

        // Then check query parameter (for language switches)
        if (req.query && req.query.lng) {
            return req.query.lng;
        }

        // Then check cookie (for persistence)
        if (req.cookies && req.cookies.lang) {
            return req.cookies.lang;
        }

        // Finally check accept-language header
        if (req.headers && req.headers['accept-language']) {
            const acceptLang = req.headers['accept-language'].split(',')[0];
            return acceptLang.startsWith('ar') ? 'ar' : 'en';
        }

        return 'en';
    } catch (error) {
        console.error('Error getting language:', error);
        return 'en';
    }
}

module.exports = function(req, res, next) {
    try {
        // For API routes, prioritize Accept-Language header
        let lang;
        if (req.originalUrl.startsWith('/api')) {
            const acceptLang = req.headers['accept-language'];
            
            if (acceptLang) {
                // Parse the Accept-Language header properly
                const primaryLang = acceptLang.split(',')[0].split('-')[0].toLowerCase().trim();
                lang = primaryLang === 'ar' ? 'ar' : 'en';
            } else {
                // Fallback to query parameter, cookie, or default
                lang = req.query.lng || req.cookies?.lang || 'en';
            }
            
            // console.log('API Route Language Detection:', {
            //     url: req.originalUrl,
            //     acceptLanguage: acceptLang,
            //     parsedLang: acceptLang ? acceptLang.split(',')[0].split('-')[0].toLowerCase().trim() : 'none',
            //     detectedLang: lang
            // });
        } else {
            lang = getLanguageFromRequest(req);
        }

        // Normalize the language
        lang = normalizeLanguage(lang);
        
        // Store in session
        if (req.session) {
            req.session.lng = lang;
        }
        
        // Always set/update the cookie
        res.cookie('lang', lang, {
            maxAge: 365 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            path: '/'
        });
        
        // Change i18next language if available
        if (req.i18n) {
            req.i18n.changeLanguage(lang);
        }
        
        // Store in cookie if response is available
        if (res && res.cookie) {
            res.cookie('lang', lang, {
                maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
                httpOnly: true
            });
        }

        // Make language available to views
        if (res && res.locals) {
            res.locals.lng = lang;
            // Also add translation function if not available
            if (!res.locals.t) {
                res.locals.t = (key) => key;
            }
            if (!res.locals.__) {
                res.locals.__ = (key) => key;
            }
        }

        next();
    } catch (error) {
        console.error('Language middleware error:', error);
        // Don't break the application if language handling fails
        next();
    }
};