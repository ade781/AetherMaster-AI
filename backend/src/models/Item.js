const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'misc'
  },
  rarity: {
    type: DataTypes.STRING,
    defaultValue: 'common'
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: false
  },
  maxStack: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  isConsumable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isUsable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  effectType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  effectValue: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true
});

module.exports = Item;
