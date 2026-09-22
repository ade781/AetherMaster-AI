const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  premise: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  genre: {
    type: DataTypes.STRING,
    defaultValue: 'dark_fantasy'
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '⚔️'
  },
  defaultBackgroundId: {
    type: DataTypes.STRING,
    defaultValue: 'bg_01_tavern'
  }
}, {
  timestamps: true
});

module.exports = Campaign;
