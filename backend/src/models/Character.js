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
      let arr = [];
      if (Array.isArray(raw)) arr = raw;
      else if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) arr = parsed;
        } catch (e) {
          arr = [];
        }
      }
      return arr.map(item => {
        if (!item) return null;
        if (typeof item === 'string') return { itemId: item, id: item, quantity: 1 };
        const itemId = item.itemId || item.id;
        return {
          ...item,
          itemId,
          id: item.id || itemId,
          quantity: Number(item.quantity ?? 1)
        };
      }).filter(Boolean);
    },
    set(val) {
      if (!Array.isArray(val)) {
        this.setDataValue('inventory', []);
        return;
      }
      const canonical = val.map(item => {
        if (!item) return null;
        if (typeof item === 'string') return { itemId: item, quantity: 1 };
        return {
          itemId: item.itemId || item.id,
          quantity: Number(item.quantity ?? 1)
        };
      }).filter(i => i && i.itemId);
      this.setDataValue('inventory', canonical);
    }
  },
  equippedItems: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('equippedItems');
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
  statusEffects: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('statusEffects');
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
  }
}, {
  timestamps: true
});

module.exports = Character;
