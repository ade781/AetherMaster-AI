const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { BASE_ITEMS, BASE_SPELLS } = require('../data/dndCatalog');

const Character = sequelize.define('Character', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  race: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Manusia',
  },
  subrace: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  characterClass: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Pendekar',
  },
  subclass: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  background: {
    type: DataTypes.STRING(50),
    defaultValue: 'Prajurit Kerajaan',
  },
  alignment: {
    type: DataTypes.STRING(50),
    defaultValue: 'Neutral Good',
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Ability Scores D&D 5E
  strength: { type: DataTypes.INTEGER, defaultValue: 10 },
  dexterity: { type: DataTypes.INTEGER, defaultValue: 10 },
  constitution: { type: DataTypes.INTEGER, defaultValue: 10 },
  intelligence: { type: DataTypes.INTEGER, defaultValue: 10 },
  wisdom: { type: DataTypes.INTEGER, defaultValue: 10 },
  charisma: { type: DataTypes.INTEGER, defaultValue: 10 },

  // Combat stats
  maxHp: { type: DataTypes.INTEGER, defaultValue: 10 },
  currentHp: { type: DataTypes.INTEGER, defaultValue: 10 },
  tempHp: { type: DataTypes.INTEGER, defaultValue: 0 },
  baseArmorClass: { type: DataTypes.INTEGER, defaultValue: 10 },
  armorClass: { type: DataTypes.INTEGER, defaultValue: 10 },
  speed: { type: DataTypes.INTEGER, defaultValue: 30 },
  proficiencyBonus: { type: DataTypes.INTEGER, defaultValue: 2 },
  inspiration: { type: DataTypes.BOOLEAN, defaultValue: false },

  // Equipment slots
  equipment: {
    type: DataTypes.JSON,
    defaultValue: {
      head: null,
      chest: null,
      mainHand: null,
      offHand: null,
      ring: null,
      boots: null,
    },
  },

  // Spell Slots (max & current)
  spellSlots: {
    type: DataTypes.JSON,
    defaultValue: {
      level1: { max: 2, current: 2 },
      level2: { max: 0, current: 0 },
      level3: { max: 0, current: 0 },
    },
  },

  // Active status conditions (buff / debuff)
  conditions: {
    type: DataTypes.JSON,
    defaultValue: [],
  },

  skills: { type: DataTypes.JSON, defaultValue: [] },
  savingThrows: { type: DataTypes.JSON, defaultValue: [] },
  features: { type: DataTypes.JSON, defaultValue: [] },
  inventory: {
    type: DataTypes.JSON,
    defaultValue: [
      BASE_ITEMS[0], // Longsword
      BASE_ITEMS[5], // Shield
      BASE_ITEMS[9], // Healing Potion
      BASE_ITEMS[10], // Torch
      BASE_ITEMS[11], // Rations
    ],
  },
  spells: {
    type: DataTypes.JSON,
    defaultValue: [
      BASE_SPELLS[0], // Firebolt
      BASE_SPELLS[2], // Magic Missile
      BASE_SPELLS[3], // Cure Wounds
    ],
  },
  gold: { type: DataTypes.INTEGER, defaultValue: 25 },
  avatarUrl: { type: DataTypes.STRING, allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
});

module.exports = Character;
