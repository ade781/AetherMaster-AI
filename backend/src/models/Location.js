const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  campaignId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  backgroundId: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'bg_01_tavern'
  },
  parentLocationId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  locationType: {
    type: DataTypes.STRING,
    defaultValue: 'interior'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true
});

module.exports = Location;
