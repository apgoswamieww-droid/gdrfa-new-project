const { Sequelize } = require('sequelize');

/**
 * MSSQL-compatible replacement for MySQL's FIND_IN_SET function
 * 
 * FIND_IN_SET(value, comma_separated_list) is replaced with:
 * CHARINDEX(',' + value + ',', ',' + comma_separated_list + ',') > 0
 * 
 * This handles edge cases like:
 * - value at beginning: ",1,2,3"
 * - value at end: "1,2,3,"
 * - value in middle: "1,2,3"
 * - single value: "1"
 * 
 * @param {string|number} searchValue - The value to search for
 * @param {string} columnName - The column name containing comma-separated values
 * @returns {object} Sequelize literal for MSSQL compatibility
 */
function findInSetMSSQL(searchValue, columnName) {
    // Convert to string to handle both string and numeric values
    const valueStr = String(searchValue);
    
    // Use CHARINDEX to find the value surrounded by commas
    // Add commas to both ends to handle edge cases
    return Sequelize.literal(
        `CHARINDEX(',' + '${valueStr}' + ',', ',' + [${columnName}] + ',') > 0`
    );
}

/**
 * Creates a Sequelize where condition for FIND_IN_SET equivalent in MSSQL
 * 
 * @param {string|number} searchValue - The value to search for
 * @param {object} column - Sequelize column reference
 * @returns {object} Sequelize where condition
 */
function whereFoundInSet(searchValue, column) {
    const columnName = column.col || column;
    return Sequelize.where(findInSetMSSQL(searchValue, columnName), true);
}

/**
 * MSSQL-compatible replacement for MySQL's FIELD function
 * 
 * FIELD(column, value1, value2, value3) is replaced with:
 * CASE WHEN column = value1 THEN 1 WHEN column = value2 THEN 2 WHEN column = value3 THEN 3 ELSE 0 END
 * 
 * @param {string} columnName - The column name to check (can include table prefix like 'User.id')
 * @param {Array} values - Array of values to match against
 * @returns {object} Sequelize literal for MSSQL compatibility
 */
function fieldMSSQL(columnName, values) {
    if (!Array.isArray(values) || values.length === 0) {
        return Sequelize.literal('0');
    }
    
    // Handle table.column format properly for MSSQL
    let formattedColumn = columnName;
    if (columnName.includes('.')) {
        const parts = columnName.split('.');
        formattedColumn = `[${parts[0]}].[${parts[1]}]`;
    } else {
        formattedColumn = `[${columnName}]`;
    }
    
    let caseStatement = 'CASE ';
    values.forEach((value, index) => {
        caseStatement += `WHEN ${formattedColumn} = ${typeof value === 'string' ? `'${value}'` : value} THEN ${index + 1} `;
    });
    caseStatement += 'ELSE 0 END';
    
    return Sequelize.literal(caseStatement);
}

/**
 * Creates a condition to check if a column value is NOT in the FIELD list (equivalent to FIELD() = 0)
 * 
 * @param {string} columnName - The column name to check
 * @param {Array} values - Array of values that should come AFTER non-matching values
 * @returns {object} Sequelize literal for MSSQL compatibility
 */
function fieldNotInListMSSQL(columnName, values) {
    if (!Array.isArray(values) || values.length === 0) {
        return Sequelize.literal('1'); // If no values to exclude, everything is "not in list"
    }
    
    // Handle table.column format properly for MSSQL
    let formattedColumn = columnName;
    if (columnName.includes('.')) {
        const parts = columnName.split('.');
        formattedColumn = `[${parts[0]}].[${parts[1]}]`;
    } else {
        formattedColumn = `[${columnName}]`;
    }
    
    // Create condition: CASE WHEN column NOT IN (values) THEN 1 ELSE 0 END
    const valuesList = values.map(v => typeof v === 'string' ? `'${v}'` : v).join(',');
    return Sequelize.literal(`CASE WHEN ${formattedColumn} NOT IN (${valuesList}) THEN 1 ELSE 0 END`);
}

/**
 * Formats MSSQL TIME field to HH:MM string format
 * 
 * MSSQL TIME fields can return as objects, Date objects, or strings
 * This function normalizes them to HH:MM string format
 * 
 * @param {any} timeValue - The time value from MSSQL (could be string, Date, object, etc.)
 * @returns {string} Formatted time as HH:MM or empty string if invalid
 */
function formatMSSQLTime(timeValue) {
    if (!timeValue && timeValue !== 0) return '';
    
    const moment = require('moment');
    
    try {
        if (typeof timeValue === 'string') {
            // Already a string, ensure it's in HH:MM format
            if (timeValue.length >= 5 && timeValue.includes(':')) {
                return timeValue.slice(0, 5);
            }
            return timeValue;
        } else if (timeValue instanceof Date) {
            // MSSQL TIME fields return as Date objects with 1970-01-01 base date
            // Extract only the time portion
            return moment(timeValue).format('HH:mm');
        } else if (typeof timeValue === 'object' && timeValue !== null) {
            // Handle MSSQL TIME object format (could be Buffer or other object)
            const timeStr = timeValue.toString();
            
            if (timeStr.includes(':')) {
                // Try to parse as time string
                const parsed = moment(timeStr, ['HH:mm:ss', 'HH:mm:ss.SSS', 'HH:mm'], true);
                if (parsed.isValid()) {
                    return parsed.format('HH:mm');
                }
            }
            
            // If it's a buffer or other object, try different approaches
            if (timeValue.buffer || Buffer.isBuffer(timeValue)) {
                // Might be a buffer representation
                return '';
            }
            
            return '';
        } else if (typeof timeValue === 'number') {
            // Could be milliseconds or seconds since midnight
            const hours = Math.floor(timeValue / 3600000) % 24;
            const minutes = Math.floor((timeValue % 3600000) / 60000);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        
        // Fallback - convert to string
        return String(timeValue);
    } catch (error) {
        console.warn('Error formatting MSSQL time:', error.message, 'Value:', timeValue, 'Type:', typeof timeValue);
        return '';
    }
}

module.exports = {
    findInSetMSSQL,
    whereFoundInSet,
    fieldMSSQL,
    fieldNotInListMSSQL,
    formatMSSQLTime
};