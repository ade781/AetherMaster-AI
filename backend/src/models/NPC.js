const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NPC = sequelize.define('NPC', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  characterType: {
    type: DataTypes.STRING,
    defaultValue: 'npc'
  },
  portraitId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'char_npc_01_barkeep'
  },
  defaultLocationId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  personality: {
    type: DataTypes.STRING,
    allowNull: true
  },
  background: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = NPC;
