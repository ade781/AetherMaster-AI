const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Quest = sequelize.define('Quest', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  campaignId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'main'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  targetLocationId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true
});

module.exports = Quest;
