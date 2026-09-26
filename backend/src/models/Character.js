const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Character = sequelize.define('Character', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  race: {
    type: DataTypes.STRING,
    defaultValue: 'human'
  },
  characterClass: {
    type: DataTypes.STRING,
    defaultValue: 'warrior'
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  hp: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  maxHp: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  mana: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  maxMana: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  gold: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  armorClass: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  str: {
    type: DataTypes.INTEGER,
    defaultValue: 14
  },
  dex: {
    type: DataTypes.INTEGER,
    defaultValue: 12
  },
  int: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  wis: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  cha: {
    type: DataTypes.INTEGER,
    defaultValue: 12
  },
  con: {
    type: DataTypes.INTEGER,
    defaultValue: 14
  },
  avatarUrl: {
    type: DataTypes.STRING,
    defaultValue: 'char_hero_01_paladin'
  },
  inventory: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('inventory');
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
  equippedItems: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  statusEffects: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = Character;
