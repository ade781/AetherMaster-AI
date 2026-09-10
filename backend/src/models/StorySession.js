const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StorySession = sequelize.define('StorySession', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Petualangan Baru',
  },
  location: {
    type: DataTypes.STRING,
    defaultValue: 'Kedai The Whispering Hearth',
  },
  currentScene: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  history: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: 'story_sessions',
});

module.exports = StorySession;
