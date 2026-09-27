const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuestObjective = sequelize.define('QuestObjective', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  questId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  objectiveType: {
    type: DataTypes.STRING,
    defaultValue: 'INVESTIGATE'
  },
  targetId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requiredCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  sequence: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  isOptional: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true
});

module.exports = QuestObjective;
