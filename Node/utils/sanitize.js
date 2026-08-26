function sanitizeHtml(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/<[^>]*>/g, '');
}

function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
            obj[key] = sanitizeHtml(obj[key]);
        } else if (Array.isArray(obj[key])) {
            obj[key] = obj[key].map(item =>
                typeof item === 'string' ? sanitizeHtml(item) : sanitizeObject(item)
            );
        } else if (obj[key] && typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
        }
    }
    return obj;
}

function xssSanitize(req, res, next) {
    if (req.body) {
        sanitizeObject(req.body);
    }
    if (req.query) {
        sanitizeObject(req.query);
    }
    if (req.params) {
        sanitizeObject(req.params);
    }
    next();
}

module.exports = { sanitizeHtml, sanitizeObject, xssSanitize };
