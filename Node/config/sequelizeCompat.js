/**
 * Minimal Sequelize wrapper for dbDirect
 * Provides basic compatibility layer for remaining Sequelize calls
 */
const db = require('./dbDirect');

const models = {};

class SequelizeModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async findOne(options) {
    if (!options.where) return null;

    const whereClause = options.where;
    const keys = Object.keys(whereClause);
    const conditions = keys.map((key, idx) => `[${key}] = ?`).join(' AND ');
    const values = Object.values(whereClause);
    const attributes = options.attributes ? options.attributes.map(a => `[${a}]`).join(', ') : '*';

    const sql = `SELECT ${attributes} FROM [${this.tableName}] WHERE ${conditions}`;
    return await db.queryOne(sql, values);
  }

  async findByPk(id, options = {}) {
    const attributes = options.attributes ? options.attributes.map(a => `[${a}]`).join(', ') : '*';
    const sql = `SELECT ${attributes} FROM [${this.tableName}] WHERE id = ?`;
    return await db.queryOne(sql, [id]);
  }

  async findAndCountAll(options) {
    let sql = `SELECT * FROM [${this.tableName}]`;
    let countSql = `SELECT COUNT(*) as count FROM [${this.tableName}]`;
    const values = [];

    if (options.where) {
      const whereClause = options.where;
      const keys = Object.keys(whereClause);
      const conditions = keys.map(() => '[?] = ?').join(' AND ');
      // Note: This is a simplified version
    }

    if (options.limit && options.offset) {
      sql += ` OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`;
      values.push(options.offset, options.limit);
    }

    const rows = await db.query(sql, values);
    const countResult = await db.queryOne(countSql, []);
    const count = countResult ? countResult.count : 0;

    return { rows: rows || [], count };
  }

  async update(values, options) {
    if (!options.where) return;

    const whereClause = options.where;
    const keys = Object.keys(whereClause);
    const whereConditions = keys.map(() => '[?] = ?').join(' AND ');
    const whereValues = Object.values(whereClause);

    const updateKeys = Object.keys(values);
    const setClause = updateKeys.map(() => '[?] = ?').join(', ');
    const updateValues = Object.values(values);

    // Simplified - actual implementation would need proper parameter binding
    const sql = `UPDATE [${this.tableName}] SET ${updateKeys.map(k => `[${k}] = ?`).join(', ')} WHERE ${keys.map(k => `[${k}] = ?`).join(' AND ')}`;

    return await db.query(sql, [...updateValues, ...whereValues]);
  }

  async destroy(options) {
    if (!options.where) return;

    const whereClause = options.where;
    const keys = Object.keys(whereClause);
    const conditions = keys.map(key => `[${key}] = ?`).join(' AND ');
    const values = Object.values(whereClause);

    const sql = `DELETE FROM [${this.tableName}] WHERE ${conditions}`;
    return await db.query(sql, values);
  }
}

// Create proxy models for backward compatibility
const getModel = (modelName) => {
  const tableMap = {
    'User': 'users',
    'Notification': 'notifications',
    'Event': 'events',
    'Role': 'roles',
    'Permission': 'permissions',
    'Team': 'teams',
    'SportActivity': 'sport_activities',
    'CmsPage': 'cms_pages',
    'BlogPost': 'blog_posts',
    'Media': 'media',
    'Evaluation': 'evaluations',
    'EventActivitySchedule': 'event_activity_schedules',
    'Participant': 'participates',
    'FacilityRequest': 'facility_requests'
  };

  const tableName = tableMap[modelName] || modelName.toLowerCase() + 's';

  if (!models[modelName]) {
    models[modelName] = new SequelizeModel(tableName);
  }

  return models[modelName];
};

module.exports = { getModel };
