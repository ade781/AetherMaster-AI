const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'mysql';

let sequelize;

if (dialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'ai_dungeon_vtt',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || path.join(__dirname, '../database.sqlite'),
    logging: false,
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[Database] Connected successfully to MySQL (${process.env.DB_NAME || 'ai_dungeon_vtt'})`);
    // Sync models automatically
    await sequelize.sync({ alter: true });
    console.log('[Database] All models synchronized.');
  } catch (error) {
    if (dialect === 'mysql') {
      console.warn(`[Database] MySQL connection failed (${error.message}). Falling back to SQLite temporary database...`);
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../database.sqlite'),
        logging: false,
      });
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      console.log('[Database] Fallback SQLite ready.');
    } else {
      console.error('[Database] Connection error:', error);
    }
  }
};

module.exports = { sequelize, connectDB };
