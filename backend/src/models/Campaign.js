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
  introDialogue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  genre: {
    type: DataTypes.STRING,
    defaultValue: 'dark_fantasy'
  },
  threatLevel: {
    type: DataTypes.STRING,
    defaultValue: 'Tier 1 (Level 1-3)'
  },
  recommendedClasses: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  primarySkill: {
    type: DataTypes.STRING,
    defaultValue: 'Persepsi & Investigasi'
  },
  defaultBackgroundId: {
    type: DataTypes.STRING,
    defaultValue: 'bg_01_tavern'
  },
  defaultNpcId: {
    type: DataTypes.STRING,
    defaultValue: 'char_npc_01_barkeep'
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '⚔️'
  },
  coverImage: {
    type: DataTypes.STRING,
    defaultValue: '/assets/backgrounds/bg_01_tavern.png'
  },
  factions: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = Campaign;
