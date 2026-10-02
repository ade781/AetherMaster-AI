const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomCampaign = sequelize.define('CustomCampaign', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  premise: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  theme: {
    type: DataTypes.STRING,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.STRING,
    defaultValue: 'normal'
  },
  nodesData: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  npcPool: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  enemyPool: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = CustomCampaign;
