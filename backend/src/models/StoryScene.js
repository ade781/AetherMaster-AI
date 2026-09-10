const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StoryScene = sequelize.define('StoryScene', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  campaignId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parentId: {
    type: DataTypes.STRING,
    allowNull: true, // null for root/opening scene of the playthrough
  },
  choiceTrigger: {
    type: DataTypes.STRING,
    allowNull: true, // action text that brought the player here
  },
  chapterTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  speaker: {
    type: DataTypes.STRING,
    defaultValue: 'Dungeon Master',
  },
  mood: {
    type: DataTypes.STRING,
    defaultValue: 'mysterious',
  },
  dialogue: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  consequenceNote: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  choices: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: 'story_scenes',
});

module.exports = StoryScene;
