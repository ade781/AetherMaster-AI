const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GameSession = sequelize.define('GameSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campaignId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  characterId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  currentSceneId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  turnCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  combatState: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  worldLedger: {
    type: DataTypes.JSON,
    defaultValue: {
      questFlags: {},
      reputation: {}
    }
  },
  isGameOver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  savedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  slotNumber: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  saveTitle: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = GameSession;
