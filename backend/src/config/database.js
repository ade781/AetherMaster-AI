const path = require('path');
const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test'
  || process.env.npm_lifecycle_event === 'test'
  || process.env.npm_lifecycle_event?.includes('test')
  || (typeof process.env.NODE_TEST_CONTEXT !== 'undefined')
  || process.argv.some(arg => typeof arg === 'string' && (/tests?[\\/]/.test(arg) || arg.includes('test')));

if (isTest) {
  process.env.NODE_ENV = 'test';
}

// Load environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction
  ? path.join(__dirname, '../../.env.production')
  : path.join(__dirname, '../../.env');

require('dotenv').config({ path: envFile });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const logging = process.env.DB_LOGGING === 'true' ? console.log : false;
const pool = {
  max: isProduction ? 10 : 5,
  min: 0,
  acquire: 30000,
  idle: 10000
};

let sequelize;

if (process.env.DATABASE_URL) {
  // Cloud Managed PostgreSQL (Supabase, Neon, Render, Railway, etc.)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: require('pg'),
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool,
    logging
  });
} else {
  // Local or standard connection: MySQL (default) or PostgreSQL based on DB_DIALECT
  const dialect = (process.env.DB_DIALECT || 'mysql').toLowerCase();
  const isPostgres = dialect === 'postgres' || dialect === 'postgresql';

  sequelize = new Sequelize(
    process.env.DB_NAME || (isPostgres ? 'postgres' : 'ai_dungeon_vtt'),
    process.env.DB_USER || (isPostgres ? 'postgres' : 'root'),
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || (isPostgres ? 5432 : 3306),
      dialect: isPostgres ? 'postgres' : 'mysql',
      dialectModule: isPostgres ? require('pg') : require('mysql2'),
      dialectOptions: isPostgres
        ? {
            ssl: process.env.DB_SSL === 'false' ? false : {
              require: true,
              rejectUnauthorized: false
            }
          }
        : {},
      pool,
      logging
    }
  );
}

/**
 * Validates database connectivity without executing destructive schema migrations.
 */
async function assertDatabaseConnection() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (err) {
    console.error('[Database Connection Error]:', err.message);
    throw err;
  }
}

module.exports = { sequelize, assertDatabaseConnection, isProduction };
