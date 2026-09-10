const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'sqlite';
const storage = process.env.DB_STORAGE 
  ? path.resolve(__dirname, '../../', process.env.DB_STORAGE) 
  : path.resolve(__dirname, '../../database.sqlite');

const sequelize = dialect === 'sqlite' 
  ? new Sequelize({
      dialect: 'sqlite',
      storage,
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME || 'aethermaster_db',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      }
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log(`🗄️ [Sequelize] Database connected (${dialect})`);
  } catch (error) {
    console.error('❌ [Sequelize] Database connection failed:', error.message);
    throw error;
  }
};

module.exports = { sequelize, connectDB };
