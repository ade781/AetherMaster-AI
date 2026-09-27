const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WorldFact = sequelize.define('WorldFact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  campaignId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subjectType: {
    type: DataTypes.STRING,
    defaultValue: 'WORLD_EVENT' // NPC | LOCATION | ITEM | FACTION | WORLD_EVENT
  },
  subjectId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  factType: {
    type: DataTypes.STRING,
    defaultValue: 'EVENT'
  },
  fact: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  importance: {
    type: DataTypes.STRING,
    defaultValue: 'normal' // critical | high | normal | low
  },
  sourceNodeId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  turn: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true
});

module.exports = WorldFact;
