/**
 * Legacy Sequelize Configuration - DEPRECATED
 * 
 * This file is kept for backward compatibility only.
 * The project has migrated to direct SQL Server queries using msnodesqlv8.
 * 
 * For database operations, use:
 * const db = require('./dbDirect');
 * 
 * This stub prevents import errors while the codebase is being refactored
 * to remove Sequelize dependencies entirely.
 */

// Create a minimal stub model object with all common Sequelize methods
class StubModel {
  constructor(name) {
    this.name = name;
    this.prototype = {};

    // Add relationship methods
    this.hasMany = () => this;
    this.belongsTo = () => this;
    this.hasOne = () => this;
    this.belongsToMany = () => this;
    this.association = {};
  }

  static sync() {
    return Promise.resolve();
  }

  static authenticate() {
    return Promise.resolve();
  }

  static close() {
    return Promise.resolve();
  }
}

// Return a minimal stub object to prevent errors
module.exports = {
  sequelize: {
    define: (name, schema, options) => {
      const model = new StubModel(name);
      model.prototype = {
        get: () => ({}),
        toJSON: function () { return {}; }
      };
      return model;
    },
    sync: () => Promise.resolve(),
    authenticate: () => Promise.resolve(),
    close: () => Promise.resolve(),
    model: () => null,
    models: {},
    transaction: () => Promise.resolve(),
    query: () => Promise.resolve([])
  },
  Sequelize: null,
  sync: () => Promise.resolve(),
  close: () => Promise.resolve(),
  authenticate: () => Promise.resolve(),
  define: (name, schema, options) => {
    const model = new StubModel(name);
    model.prototype = {
      get: () => ({}),
      toJSON: function () { return {}; }
    };
    return model;
  },
  model: () => null,
  models: {},
  transaction: () => Promise.resolve(),
  query: () => Promise.resolve([])
};

