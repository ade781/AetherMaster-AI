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
    defaultValue: null,
    get() {
      const raw = this.getDataValue('combatState');
      if (!raw) return null;
      if (typeof raw === 'object') return raw;
      try { return JSON.parse(raw); } catch (e) { return null; }
    }
  },
  worldLedger: {
    type: DataTypes.JSON,
    defaultValue: {
      questFlags: {},
      reputation: {}
    },
    get() {
      const raw = this.getDataValue('worldLedger');
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch (e) {}
      }
      return { questFlags: {}, reputation: {} };
    }
  },
  missionLog: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    get() {
      const raw = this.getDataValue('missionLog');
      if (!raw) return null;
      if (typeof raw === 'object') return raw;
      try { return JSON.parse(raw); } catch (e) { return null; }
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
