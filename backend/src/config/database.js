const path = require('path');
const { Sequelize } = require('sequelize');

// Load environment variables (.env.production if production, fallback to .env)
const envFile = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../../.env.production')
  : path.join(__dirname, '../../.env');

require('dotenv').config({ path: envFile });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const dialect = process.env.DB_DIALECT || (process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : 'mysql');
let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  });
} else if (dialect === 'postgres') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.DB_SSL === 'false' ? false : {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: false
    }
  );
} else {
  // Default to MySQL (XAMPP / Local or Production MySQL)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'ai_dungeon_vtt',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: false
    }
  );
}

module.exports = { sequelize };



