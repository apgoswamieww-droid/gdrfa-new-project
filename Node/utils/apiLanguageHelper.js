/**
 * API Language Helper
 * Handles multilingual content for API responses based on Accept-Language header
 */

/**
 * Get the language from request headers
 * @param {Object} req - Express request object
 * @returns {string} - Language code ('en' or 'ar')
 */
function getApiLanguage(req) {
    try {
        const acceptLang = req.headers['accept-language'];
        
        if (!acceptLang) {
            return 'en'; // Default to English
        }
        
        // Parse the Accept-Language header
        const primaryLang = acceptLang.split(',')[0].split('-')[0].toLowerCase();
        
        // Return 'ar' for Arabic, 'en' for everything else
        return primaryLang === 'ar' ? 'ar' : 'en';
    } catch (error) {
        console.error('Error parsing Accept-Language header:', error);
        return 'en'; // Default fallback
    }
}

/**
 * Get the appropriate field value based on language
 * @param {Object} item - Database item with multilingual fields
 * @param {string} fieldName - Base field name (without language suffix)
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {string} - Localized field value
 */
function getLocalizedField(item, fieldName, lang = 'en') {
    if (!item) return null;
    
    if (lang === 'ar') {
        const arField = `${fieldName}_ar`;
        const arValue = item[arField];
        
        // Handle different data types for Arabic field
        if (arValue !== null && arValue !== undefined) {
            // For string fields (title, shortDescription)
            if (typeof arValue === 'string' && arValue.trim()) {
                return arValue;
            }
            // For object/JSON fields (content) - if it exists and is not empty
            else if (typeof arValue === 'object' && arValue !== null) {
                return arValue;
            }
            // For other non-empty values
            else if (arValue && arValue.toString().trim()) {
                return arValue;
            }
        }
        
        // Fallback to English field
        return item[fieldName];
    }
    
    // For English or any other language, return the base field
    return item[fieldName];
}

/**
 * Transform a database item to include only the appropriate language fields
 * @param {Object} item - Database item
 * @param {Array} fields - Array of field names to localize
 * @param {string} lang - Language code
 * @returns {Object} - Transformed item with localized fields
 */
function localizeItem(item, fields, lang = 'en') {
    if (!item) return null;
    
    // Convert Sequelize instance to plain object if needed
    const plainItem = item.dataValues ? item.dataValues : item;
    const localized = {};
    
    // Copy non-multilingual fields (skip Arabic fields and base fields that will be localized)
    Object.keys(plainItem).forEach(key => {
        if (!key.endsWith('_ar') && !fields.includes(key)) {
            localized[key] = plainItem[key];
        }
    });
    
    // Add localized fields
    fields.forEach(field => {
        localized[field] = getLocalizedField(plainItem, field, lang);
    });
    
    return localized;
}

/**
 * Transform an array of database items to include only appropriate language fields
 * @param {Array} items - Array of database items
 * @param {Array} fields - Array of field names to localize
 * @param {string} lang - Language code
 * @returns {Array} - Array of transformed items
 */
function localizeItems(items, fields, lang = 'en') {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => localizeItem(item, fields, lang));
}

/**
 * Get localized message using req.__ if available, otherwise return the key
 * @param {Object} req - Express request object
 * @param {string} key - Translation key
 * @param {Object} options - Translation options
 * @returns {string} - Localized message
 */
function getLocalizedMessage(req, key, options = {}) {
    try {
        if (req.__ && typeof req.__ === 'function') {
            return req.__(key, options);
        }
        if (req.t && typeof req.t === 'function') {
            return req.t(key, options);
        }
        return key; // Fallback to key if no translation function available
    } catch (error) {
        console.error('Error getting localized message:', error);
        return key;
    }
}

module.exports = {
    getApiLanguage,
    getLocalizedField,
    localizeItem,
    localizeItems,
    getLocalizedMessage
};