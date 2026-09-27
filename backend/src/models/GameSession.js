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
      facts: [],
      flags: {},
      questFlags: {},
      reputation: {}
    },
    get() {
      const raw = this.getDataValue('worldLedger');
      let obj = raw;
      if (typeof raw === 'string') {
        try {
          obj = JSON.parse(raw);
        } catch (e) {
          obj = {};
        }
      }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        obj = {};
      }
      const facts = Array.isArray(obj.facts) ? obj.facts : [];
      const flags = { ...(obj.flags || {}) };
      const questFlags = { ...(obj.questFlags || {}) };
      const reputation = { ...(obj.reputation || {}) };
      // Bi-directional sync
      for (const [k, v] of Object.entries(questFlags)) {
        if (flags[k] === undefined) flags[k] = v;
      }
      for (const [k, v] of Object.entries(flags)) {
        if (questFlags[k] === undefined) questFlags[k] = v;
      }
      return { facts, flags, questFlags, reputation };
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
