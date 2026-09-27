const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StorySnapshot = sequelize.define('StorySnapshot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  storyNodeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  characterState: {
    type: DataTypes.JSON,
    allowNull: false
  },
  inventoryState: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  questState: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  worldState: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  ledgerState: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true
});

module.exports = StorySnapshot;
