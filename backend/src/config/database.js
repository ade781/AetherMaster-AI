const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbStorage = process.env.DB_STORAGE
  ? path.resolve(__dirname, '../../', process.env.DB_STORAGE)
  : path.resolve(__dirname, '../../ai_dungeon_vtt.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbStorage,
  logging: false
});

module.exports = { sequelize, dbStorage };
