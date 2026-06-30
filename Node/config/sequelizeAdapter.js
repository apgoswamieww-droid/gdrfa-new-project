/**
 * Sequelize-to-dbDirect Adapter
 * Provides a drop-in replacement for Sequelize models
 * Maps common Sequelize methods to dbDirect SQL queries
 */

const db = require('./dbDirect');
const { Op } = require('sequelize');

// Table name mapping
const TABLE_MAP = {
  'User': 'users',
  'Role': 'roles',
  'Permission': 'permissions',
  'RolePermission': 'RolePermissions',
  'Department': 'departments',
  'Sector': 'sectors',
  'Section': 'sections',
  'Branch': 'branches',
  'Rank': 'ranks',
  'JobTitle': 'job_titles',
  'Kpi': 'kpis',
  'Plan': 'plans',
  'ActivityType': 'activity_types',
  'EventType': 'event_types',
  'SportActivity': 'sport_activities',
  'Event': 'events',
  'Contact': 'contacts',
  'Team': 'teams',
  'TeamPlayer': 'team_players',
  'Faq': 'faqs',
  'HomeSlider': 'home_sliders',
  'CmsPage': 'cms_pages',
  'Facilities': 'facilities',
  'FacilityRequest': 'facility_requests',
  'BlogPost': 'blog_posts',
  'Tag': 'tags',
  'PostTag': 'post_tags',
  'Media': 'media',
  'Evaluation': 'evaluations',
  'Participate': 'participates',
  'Participant': 'participates',
  'EventActivitySchedule': 'event_activity_schedules',
  'Notification': 'notifications',
  'TokenBlacklist': 'TokenBlacklists',
  'FitnessCategory': 'fitness_categories',
  'FitnessAgeGroup': 'fitness_age_groups',
  'FitnessScoreMatrix': 'fitness_score_matrix',
  'ContactUs': 'contacts',
  'Sponsor': 'sponsors'
};

// Foreign key mapping for specific relationships
const FK_MAP = {
  'SportActivity-ActivityType': 'activityType', // sport_activities.activityType -> activity_types.id
  'Event-ActivityType': 'activityType',
  'EventActivitySchedule-SportActivity': 'activity_id', // event_activity_schedules.activity_id -> sport_activities.id
};

class SequelizeAdapter {
  constructor(modelName) {
    this.modelName = modelName;
    this.tableName = TABLE_MAP[modelName] || modelName.toLowerCase() + 's';
    this._columnCache = null; // lazy cache for hasColumn checks
    this._validColumnsCache = null; // Cache for valid columns in this table
  }

  async findByPk(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const result = await db.queryOne(sql, [id]);
    if (result) {
      // Return an instance with methods attached
      return this._createInstance(result);
    }
    return null;
  }

  async findOne(options = {}) {
    if (!options.where) {
      const sql = `SELECT TOP 1 * FROM ${this.tableName}`;
      const result = await db.queryOne(sql, []);
      return result ? this._createInstance(result) : null;
    }

    const { where, attributes } = options;
    const conditions = this._buildWhereClause(where);
    const sql = `SELECT TOP 1 ${this._buildSelectClause(attributes)} FROM ${this.tableName} ${conditions.clause}`;
    const result = await db.queryOne(sql, conditions.params);
    return result ? this._createInstance(result) : null;
  }

  async findAll(options = {}) {
    const { where = {}, attributes, limit, offset = 0, order = [], include = [] } = options;
    const conditions = this._buildWhereClause(where, include.length > 0 ? this.tableName : null);
    const orderClause = this._buildOrderClause(order);
    const limitClause = limit ? ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY` : '';

    let joinClause = '';
    let selectFields = [];

    // Handle main table selection
    if (attributes && attributes.length > 0) {
      selectFields.push(attributes.map(attr => `${this.tableName}.${attr}`).join(', '));
    } else {
      selectFields.push(`${this.tableName}.*`);
    }

    // Handle includes (Joins)
    if (include && include.length > 0) {
      for (const inc of include) {
        const model = inc.model;
        const alias = model.modelName;
        const incTable = model.tableName;
        
        // Try to get FK from mapping first, then fall back to convention
        let fk = inc.foreignKey;
        if (!fk) {
          const mapKey = `${this.modelName}-${alias}`;
          fk = FK_MAP[mapKey] || `${alias.toLowerCase()}Id`;
        }

        joinClause += ` LEFT JOIN ${incTable} AS [${alias}] ON ${this.tableName}.${fk} = [${alias}].id`;

        if (inc.attributes) {
          inc.attributes.forEach(attr => {
            selectFields.push(`[${alias}].${attr} AS [${alias}.${attr}]`);
          });
        }
      }
    }

    const selectClause = selectFields.join(', ');
    const sql = `SELECT ${selectClause} FROM ${this.tableName} ${joinClause} ${conditions.clause} ${orderClause} ${limitClause}`;
    const rows = await db.query(sql, conditions.params);

    // Post-process to nest objects if includes are present
    if (include && include.length > 0) {
      return rows.map(row => {
        const newRow = { ...row };
        include.forEach(inc => {
          const alias = inc.model.modelName;
          const nestedObj = {};
          let hasData = false;
          Object.keys(row).forEach(key => {
            if (key.startsWith(`${alias}.`)) {
              const field = key.split('.')[1];
              nestedObj[field] = row[key];
              delete newRow[key]; // Remove flat key
              if (row[key] !== null) hasData = true;
            }
          });
          if (hasData) {
            newRow[alias] = nestedObj;
          }
        });
        return newRow;
      });
    }

    return rows;
  }

  async count(options = {}) {
    const { where = {} } = options;
    const conditions = this._buildWhereClause(where);
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} ${conditions.clause}`;
    const result = await db.queryOne(sql, conditions.params);
    return result ? result.count : 0;
  }

  async _getValidColumns() {
    if (this._validColumnsCache) {
      return this._validColumnsCache;
    }

    try {
      const sql = `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = ? 
        AND TABLE_SCHEMA = 'dbo'
      `;
      const results = await db.query(sql, [this.tableName]);
      const validColumns = {};
      results.forEach(row => {
        validColumns[row.COLUMN_NAME.toLowerCase()] = true;
      });
      this._validColumnsCache = validColumns;
      return validColumns;
    } catch (error) {
      console.error(`Failed to fetch column schema for ${this.tableName}:`, error);
      // Fallback to empty object if schema query fails
      return {};
    }
  }

  async create(data) {
    try {
      const now = new Date().toISOString();
      const dataWithTimestamps = { ...data, createdAt: now, updatedAt: now };
      
      // Get valid columns from database schema
      const validColumns = await this._getValidColumns();
      
      // Filter out fields that don't exist in the table (case-insensitive check)
      const filteredData = {};
      
      Object.keys(dataWithTimestamps).forEach(key => {
        if (validColumns[key.toLowerCase()]) {
          filteredData[key] = dataWithTimestamps[key];
        } else {
          console.warn(`Skipping unknown column '${key}' in table '${this.tableName}'`);
        }
      });

      const columns = Object.keys(filteredData).join(', ');
      const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
      const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}); SELECT SCOPE_IDENTITY() as id;`;
      const params = Object.values(filteredData).map(v => v === undefined ? null : v);
      const result = await db.query(sql, params);
      return { id: result[0]?.id, ...filteredData };
    } catch (error) {
      console.error(`Error creating record in ${this.tableName}:`, error.message);
      throw error;
    }
  }

  async update(data, options = {}) {
    try {
      const { where = {} } = options;
      const conditions = this._buildWhereClause(where);
      const dataWithTimestamp = { ...data, updatedAt: new Date().toISOString() };
      
      // Get valid columns from database schema
      const validColumns = await this._getValidColumns();
      
      // Filter out fields that don't exist in the table (case-insensitive check)
      const filteredData = {};
      
      Object.keys(dataWithTimestamp).forEach(key => {
        if (validColumns[key.toLowerCase()]) {
          filteredData[key] = dataWithTimestamp[key];
        } else {
          console.warn(`Skipping unknown column '${key}' in table '${this.tableName}'`);
        }
      });

      const setClause = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
      const sql = `UPDATE ${this.tableName} SET ${setClause} ${conditions.clause}`;
      const params = [...Object.values(filteredData), ...conditions.params].map(v => v === undefined ? null : v);
      const result = await db.query(sql, params);
      return [result.rowsAffected?.length || 0];
    } catch (error) {
      console.error(`Error updating record in ${this.tableName}:`, error.message);
      throw error;
    }
  }

  async destroy(options = {}) {
    const { where = {} } = options;
    const conditions = this._buildWhereClause(where);
    const sql = `DELETE FROM ${this.tableName} ${conditions.clause}`;
    return db.query(sql, conditions.params);
  }

  _createInstance(data) {
    // Create an instance object with data and methods
    const instance = { ...data };

    // Attach instance methods
    if (this.modelName === 'Role') {
      instance.setPermissions = (permissionIds) => this.setPermissions.call({ ...this, id: data.id }, permissionIds);
      instance.getPermissions = () => this.getPermissions.call({ ...this, id: data.id });
    }

    // Attach update method to instance
    instance.update = (newData) => this.update(newData, { where: { id: data.id } });
    instance.save = () => this.update(data, { where: { id: data.id } });

    return instance;
  }

  // Many-to-many relationship methods for Role-Permission
  async setPermissions(permissionIds) {
    if (this.modelName !== 'Role') {
      throw new Error('setPermissions can only be called on Role model');
    }

    const roleId = this.id;
    if (!roleId) {
      throw new Error('Role instance must have an id to set permissions');
    }

    try {
      // Remove existing permissions
      await db.query('DELETE FROM RolePermissions WHERE roleId = ?', [roleId]);

      // Add new permissions with timestamps
      if (permissionIds && permissionIds.length > 0) {
        const now = new Date().toISOString();
        const values = permissionIds.map(permissionId =>
          `(${roleId}, ${permissionId}, '${now}', '${now}')`
        ).join(', ');
        const sql = `INSERT INTO RolePermissions (roleId, permissionId, createdAt, updatedAt) VALUES ${values}`;
        await db.query(sql, []);
      }

      return true;
    } catch (error) {
      console.error('Error setting permissions:', error);
      throw error;
    }
  }

  async getPermissions() {
    if (this.modelName !== 'Role') {
      throw new Error('getPermissions can only be called on Role model');
    }

    const roleId = this.id;
    if (!roleId) {
      throw new Error('Role instance must have an id to get permissions');
    }

    try {
      const sql = `
        SELECT p.* FROM permissions p
        INNER JOIN RolePermissions rp ON p.id = rp.permissionId
        WHERE rp.roleId = ?
        ORDER BY p.module, p.name
      `;
      return await db.query(sql, [roleId]);
    } catch (error) {
      console.error('Error getting permissions:', error);
      throw error;
    }
  }

  async findOrCreate(options = {}) {
    const { where = {}, defaults = {} } = options;
    const existing = await this.findOne({ where });
    if (existing) return [existing, false];
    const created = await this.create({ ...where, ...defaults });
    return [created, true];
  }

  async bulkCreate(data) {
    const results = [];
    for (const item of data) {
      const result = await this.create(item);
      results.push(result);
    }
    return results;
  }

  async findAndCountAll(options = {}) {
    const count = await this.count(options);
    const rows = await this.findAll(options);
    return { count, rows };
  }

  _buildWhereClause(where, tablePrefix = null) {
    if (!where || Object.keys(where).length === 0) {
      return { clause: '', params: [] };
    }

    const conditions = [];
    const params = [];
    const prefix = tablePrefix ? `${tablePrefix}.` : '';

    const processValue = (key, value) => {
      const columnRef = `${prefix}${key}`;
      if (value === null) {
        conditions.push(`${columnRef} IS NULL`);
        return;
      }

      const opSymbols = Object.getOwnPropertySymbols(value);
      if (opSymbols.length > 0) {
        for (const sym of opSymbols) {
          const opValue = value[sym];
          if (sym === Op.like) {
            conditions.push(`${columnRef} LIKE ?`);
            params.push(opValue);
          } else if (sym === Op.in && Array.isArray(opValue) && opValue.length > 0) {
            conditions.push(`${columnRef} IN (${opValue.map(() => '?').join(',')})`);
            params.push(...opValue);
          } else if (sym === Op.gte) {
            conditions.push(`${columnRef} >= ?`);
            params.push(opValue);
          } else if (sym === Op.lte) {
            conditions.push(`${columnRef} <= ?`);
            params.push(opValue);
          } else if (sym === Op.gt) {
            conditions.push(`${columnRef} > ?`);
            params.push(opValue);
          } else if (sym === Op.lt) {
            conditions.push(`${columnRef} < ?`);
            params.push(opValue);
          } else if (sym === Op.ne) {
            conditions.push(`${columnRef} != ?`);
            params.push(opValue);
          }
        }
        return;
      }

      if (Array.isArray(value)) {
        conditions.push(`${columnRef} IN (${value.map(() => '?').join(',')})`);
        params.push(...value);
        return;
      }

      conditions.push(`${columnRef} = ?`);
      params.push(value);
    };

    const topLevelSymbols = Object.getOwnPropertySymbols(where);
    for (const sym of topLevelSymbols) {
      if (sym === Op.or && Array.isArray(where[sym])) {
        const orClauses = [];
        for (const conditionObj of where[sym]) {
          const subResult = this._buildWhereClause(conditionObj, tablePrefix);
          if (subResult.clause) {
            orClauses.push(`(${subResult.clause.replace('WHERE ', '')})`);
            params.push(...subResult.params);
          }
        }
        if (orClauses.length > 0) {
          conditions.push(`(${orClauses.join(' OR ')})`);
        }
      }
    }

    for (const [key, value] of Object.entries(where)) {
      processValue(key, value);
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { clause, params };
  }

  _buildSelectClause(attributes) {
    if (!attributes || attributes.length === 0) return '*';
    return Array.isArray(attributes) ? attributes.join(', ') : attributes;
  }

  _buildOrderClause(order) {
    if (!order || order.length === 0) return '';
    const orderParts = order.map(([column, direction]) => `${column} ${direction || 'ASC'}`);
    return `ORDER BY ${orderParts.join(', ')}`;
  }
}

// add a helper to check column existence for a model (cached)
SequelizeAdapter.prototype.hasColumn = async function(columnName) {
  if (!this._columnCache) {
    // query INFORMATION_SCHEMA.COLUMNS for this table
    const sql = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?`;
    try {
      const rows = await db.query(sql, [this.tableName]);
      this._columnCache = new Set(rows.map(r => (r.COLUMN_NAME || r.column_name || Object.values(r)[0]).toString()));
    } catch (err) {
      // On error, assume no columns cached to avoid blocking operations
      this._columnCache = new Set();
    }
  }
  return this._columnCache.has(columnName);
};

module.exports = {
  SequelizeAdapter,
  getModel: (modelName) => new SequelizeAdapter(modelName),
  User: new SequelizeAdapter('User'),
  Role: new SequelizeAdapter('Role'),
  Permission: new SequelizeAdapter('Permission'),
  Department: new SequelizeAdapter('Department'),
  Sector: new SequelizeAdapter('Sector'),
  Section: new SequelizeAdapter('Section'),
  Branch: new SequelizeAdapter('Branch'),
  Rank: new SequelizeAdapter('Rank'),
  JobTitle: new SequelizeAdapter('JobTitle'),
  Event: new SequelizeAdapter('Event'),
  Participate: new SequelizeAdapter('Participate'),
  Participant: new SequelizeAdapter('Participant'),
  SportActivity: new SequelizeAdapter('SportActivity'),
  Plan: new SequelizeAdapter('Plan'),
  ActivityType: new SequelizeAdapter('ActivityType'),
  Team: new SequelizeAdapter('Team'),
  TeamPlayer: new SequelizeAdapter('TeamPlayer'),
  Faq: new SequelizeAdapter('Faq'),
  HomeSlider: new SequelizeAdapter('HomeSlider'),
  CmsPage: new SequelizeAdapter('CmsPage'),
  Facilities: new SequelizeAdapter('Facilities'),
  FacilityRequest: new SequelizeAdapter('FacilityRequest'),
  BlogPost: new SequelizeAdapter('BlogPost'),
  Tag: new SequelizeAdapter('Tag'),
  PostTag: new SequelizeAdapter('PostTag'),
  Media: new SequelizeAdapter('Media'),
  Evaluation: new SequelizeAdapter('Evaluation'),
  EventActivitySchedule: new SequelizeAdapter('EventActivitySchedule'),
  Notification: new SequelizeAdapter('Notification'),
  TokenBlacklist: new SequelizeAdapter('TokenBlacklist'),
  FitnessCategory: new SequelizeAdapter('FitnessCategory'),
  ContactUs: new SequelizeAdapter('ContactUs'),
  Contact: new SequelizeAdapter('Contact'),
  Kpi: new SequelizeAdapter('Kpi'),
  EventType: new SequelizeAdapter('EventType'),
  Sponsor: new SequelizeAdapter('Sponsor')
  
};
