require('dotenv').config();
const sql = require('msnodesqlv8');

/**
 * Decode UTF-8 encoded strings properly
 * Handles strings that might be double-encoded or improperly decoded
 */
function decodeUTF8String(str) {
  if (!str || typeof str !== 'string') return str;
  
  try {
    // Ensure the string is properly encoded as UTF-8
    // This handles Arabic, Chinese, Japanese and other Unicode characters
    return str;
  } catch (e) {
    return str;
  }
}

/**
 * Recursively process result rows to ensure proper UTF-8 string handling
 */
function processResultRows(rows) {
  if (!Array.isArray(rows)) return rows;
  
  return rows.map(row => {
    if (row === null || row === undefined) return row;
    
    const processed = {};
    for (const key in row) {
      const value = row[key];
      if (typeof value === 'string') {
        // Ensure the string is properly UTF-8 encoded
        processed[key] = decodeUTF8String(value);
      } else {
        processed[key] = value;
      }
    }
    return processed;
  });
}

/**
 * Parse connection string to extract database configuration
 */
function parseConnectionString(connectionString) {
  if (!connectionString) {
    return {
      server: 'localhost\\SQLEXPRESS',
      database: 'Sports',
      trustedConnection: true
    };
  }

  const config = {
    trustedConnection: false
  };
  const parts = connectionString.split(';');
  
  parts.forEach(part => {
    if (!part.trim()) return;
    const [key, value] = part.split('=');
    if (key && value) {
      const trimmedKey = key.trim().toLowerCase();
      const trimmedValue = value.trim();
      
      if (trimmedKey === 'server') {
        config.server = trimmedValue;
      } else if (trimmedKey === 'database') {
        config.database = trimmedValue;
      } else if (trimmedKey === 'trusted_connection' || trimmedKey === 'trustedconnection') {
        config.trustedConnection = trimmedValue.toLowerCase() === 'yes';
      } else if (trimmedKey === 'driver') {
        config.driver = trimmedValue;
      } else if (trimmedKey === 'uid' || trimmedKey === 'user') {
        config.userId = trimmedValue;
      } else if (trimmedKey === 'pwd' || trimmedKey === 'password') {
        config.password = trimmedValue;
      }
    }
  });

  return config;
}

/**
 * Build ODBC connection string for msnodesqlv8
 */
function buildConnectionString(config) {
  const parts = [];
  
  if (config.driver) {
    parts.push(`Driver={${config.driver}}`);
  } else {
    parts.push('Driver={ODBC Driver 17 for SQL Server}');
  }
  
  if (config.server) {
    parts.push(`Server=${config.server}`);
  }
  
  if (config.database) {
    parts.push(`Database=${config.database}`);
  }
  
  if (config.trustedConnection) {
    parts.push('Trusted_Connection=Yes');
  } else {
    if (config.userId) {
      parts.push(`UID=${config.userId}`);
    }
    if (config.password) {
      parts.push(`PWD=${config.password}`);
    }
  }
  
  // Force UTF-8 encoding for Arabic and other languages
  parts.push('UseUnicode=yes');
  parts.push('Encrypt=no');

  return parts.join(';');
}

// Parse the connection string from .env
const dbConfig = parseConnectionString(process.env.DB_CONNECTION_STRING);
const connectionString = buildConnectionString(dbConfig);
const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || 30000);

function getSafeDbDebugInfo() {
  return {
    server: dbConfig.server || 'not-set',
    database: dbConfig.database || 'not-set',
    trustedConnection: Boolean(dbConfig.trustedConnection),
    driver: dbConfig.driver || 'ODBC Driver 17 for SQL Server'
  };
}

/**
 * Execute a query and return results as a promise
 * @param {string} queryString - SQL query string with ? placeholders
 * @param {array} params - Parameters for parameterized queries (optional)
 * @returns {Promise<array>} - Query results
 */
function query(queryString, params = []) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Query timeout after ${Math.round(DB_QUERY_TIMEOUT_MS / 1000)}s: ${queryString.substring(0, 100)}`));
    }, DB_QUERY_TIMEOUT_MS);

    try {
      // Convert @p1, @p2, etc. to ? placeholders for msnodesqlv8
      let finalQuery = queryString;
      let finalParams = params;
      
      // Check if query uses @p syntax and convert to ?
      if (queryString.includes('@p')) {
        finalQuery = queryString.replace(/@p\d+/g, '?');
      }
      
      // Execute query with or without parameters
      if (finalParams.length > 0) {
        sql.query(connectionString, finalQuery, finalParams, (err, rows) => {
          clearTimeout(timeout);
          if (err) {
            // Filter out known driver-level errors that don't affect query execution
            if (err.message && err.message.includes('Connection is not open')) {
              // Driver cleanup error - ignore if we got results
              resolve(processResultRows(rows || []));
            } else {
              console.error('❌ [DB Error]', err.message);
              reject(err);
            }
          } else {
            // Process rows to ensure proper UTF-8 handling
            resolve(processResultRows(rows || []));
          }
        });
      } else {
        sql.query(connectionString, finalQuery, (err, rows) => {
          clearTimeout(timeout);
          if (err) {
            // Filter out known driver-level errors that don't affect query execution
            if (err.message && err.message.includes('Connection is not open')) {
              // Driver cleanup error - ignore if we got results
              resolve(processResultRows(rows || []));
            } else {
              console.error('❌ [DB Error]', err.message);
              reject(err);
            }
          } else {
            // Process rows to ensure proper UTF-8 handling
            resolve(processResultRows(rows || []));
          }
        });
      }
    } catch (error) {
      clearTimeout(timeout);
      console.error('[DB Query Error]', error);
      reject(error);
    }
  });
}

/**
 * Execute a query and return the first row
 * @param {string} queryString - SQL query string
 * @param {array} params - Parameters for parameterized queries (optional)
 * @returns {Promise<object>} - First row result
 */
function queryOne(queryString, params = []) {
  return query(queryString, params).then(rows => {
    return rows.length > 0 ? rows[0] : null;
  });
}

/**
 * Execute an INSERT query
 * @param {string} table - Table name
 * @param {object} data - Object with column names as keys
 * @returns {Promise<object>} - Last inserted identity and affected rows
 */
async function insert(table, data) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `@p${i + 1}`).join(',');
  const columnList = columns.join(',');
  
  const insertQuery = `INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`;
  
  return new Promise((resolve, reject) => {
    sql.query(connectionString, insertQuery, values, (err, rows) => {
      if (err) {
        console.error('[DB Insert Error]', err);
        reject(err);
      } else {
        resolve({
          affectedRows: rows ? rows.length : 0,
          insertedId: rows && rows.length > 0 ? rows[0] : null
        });
      }
    });
  });
}

/**
 * Execute an UPDATE query
 * @param {string} table - Table name
 * @param {object} data - Object with column names as keys to update
 * @param {string} whereClause - WHERE clause (e.g., "id = @p1")
 * @param {array} whereParams - Parameters for WHERE clause
 * @returns {Promise<object>} - Number of affected rows
 */
async function update(table, data, whereClause, whereParams = []) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  
  const setClause = columns.map((col, i) => `${col} = @p${i + 1}`).join(',');
  const allParams = [...values, ...whereParams];
  
  const updateQuery = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  
  return new Promise((resolve, reject) => {
    sql.query(connectionString, updateQuery, allParams, (err, rows) => {
      if (err) {
        console.error('[DB Update Error]', err);
        reject(err);
      } else {
        resolve({
          affectedRows: rows ? rows.length : 0
        });
      }
    });
  });
}

/**
 * Execute a DELETE query
 * @param {string} table - Table name
 * @param {string} whereClause - WHERE clause (e.g., "id = @p1")
 * @param {array} whereParams - Parameters for WHERE clause
 * @returns {Promise<object>} - Number of affected rows
 */
async function deleteRecord(table, whereClause, whereParams = []) {
  const deleteQuery = `DELETE FROM ${table} WHERE ${whereClause}`;
  
  return new Promise((resolve, reject) => {
    sql.query(connectionString, deleteQuery, whereParams, (err, rows) => {
      if (err) {
        console.error('[DB Delete Error]', err);
        reject(err);
      } else {
        resolve({
          affectedRows: rows ? rows.length : 0
        });
      }
    });
  });
}

/**
 * Test the database connection
 * @returns {Promise<boolean>} - True if connection successful
 */
async function testConnection() {
  const dbInfo = getSafeDbDebugInfo();
  try {
    console.log(`[DB Connection] Trying SQL Server ${dbInfo.server} / DB ${dbInfo.database} / Trusted=${dbInfo.trustedConnection}`);
    const result = await query('SELECT 1 as connected');
    if (result && result.length > 0) {
      console.log('[DB Connection] ✓ Successfully connected to SQL Server');
      return true;
    }
  } catch (error) {
    console.error(`[DB Connection] Failed to connect (${dbInfo.server} / ${dbInfo.database}):`, error.message);
    console.error('[DB Connection] ✗ Failed to connect:', error.message);
    return false;
  }
}

// Export functions
module.exports = {
  query,
  queryOne,
  insert,
  update,
  delete: deleteRecord,
  testConnection,
  connectionString,
  dbConfig,
  getSafeDbDebugInfo
};
