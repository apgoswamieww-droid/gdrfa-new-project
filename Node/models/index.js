'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Use the centralized database connection instead of creating a new one
const sequelize = require('../config/db');
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    //const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
  });

// Define associations
if (db.User && db.Role) {
  db.User.belongsTo(db.Role, { foreignKey: 'roleId', as: 'roleData' });
  db.Role.hasMany(db.User, { foreignKey: 'roleId', as: 'users' });
}

if (db.Role && db.Permission) {
  db.Role.belongsToMany(db.Permission, { 
    through: 'RolePermissions', 
    foreignKey: 'roleId', 
    otherKey: 'permissionId',
    as: 'permissions'
  });
  
  db.Permission.belongsToMany(db.Role, { 
    through: 'RolePermissions', 
    foreignKey: 'permissionId', 
    otherKey: 'roleId',
    as: 'roles'
  });
}

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
