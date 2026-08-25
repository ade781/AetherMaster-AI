const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
    defaultValue: 'Human',
  },
  subrace: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  characterClass: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Fighter',
  },
  subclass: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  background: {
    type: DataTypes.STRING(50),
    defaultValue: 'Soldier',
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
  strength: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  dexterity: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  constitution: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  intelligence: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  wisdom: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  charisma: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  // Combat stats
  maxHp: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  currentHp: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  tempHp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  armorClass: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  speed: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  proficiencyBonus: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  inspiration: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  skills: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  savingThrows: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  inventory: {
    type: DataTypes.JSON,
    defaultValue: [
      { name: 'Potion of Healing', quantity: 2, type: 'consumable', description: 'Restores 2d4+2 HP' },
      { name: 'Rations (1 day)', quantity: 5, type: 'item', description: 'Standard trail rations' },
      { name: 'Torch', quantity: 3, type: 'item', description: 'Burns for 1 hour, 20ft bright light' }
    ],
  },
  spells: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  gold: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Character;
