const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StoryChoice = sequelize.define('StoryChoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  storyNodeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  choiceKey: {
    type: DataTypes.STRING,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  actionType: {
    type: DataTypes.STRING,
    defaultValue: 'INVESTIGATE'
  },
  tone: {
    type: DataTypes.STRING,
    defaultValue: 'cautious'
  },
  requiredItemId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sequence: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  timestamps: true
});

module.exports = StoryChoice;
