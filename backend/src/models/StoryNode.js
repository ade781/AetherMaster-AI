const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StoryNode = sequelize.define('StoryNode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  parentNodeId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  chapterTitle: {
    type: DataTypes.STRING,
    defaultValue: 'Babak I: Panggilan Takdir'
  },
  location: {
    type: DataTypes.STRING,
    defaultValue: 'Kedai Whispering Tavern'
  },
  backgroundId: {
    type: DataTypes.STRING,
    defaultValue: 'bg_01_tavern'
  },
  speaker: {
    type: DataTypes.STRING,
    defaultValue: 'Eldrin sang Barkeep'
  },
  characterId: {
    type: DataTypes.STRING,
    defaultValue: 'char_npc_01_barkeep'
  },
  mood: {
    type: DataTypes.STRING,
    defaultValue: 'mysterious'
  },
  dialogueText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  consequenceNote: {
    type: DataTypes.STRING,
    allowNull: true
  },
  choices: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('choices');
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }
      return [];
    }
  },
  combatEncounter: {
    type: DataTypes.JSON,
    allowNull: true
  },
  characterSnapshot: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = StoryNode;
