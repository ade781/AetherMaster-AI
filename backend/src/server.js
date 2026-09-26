const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Load environment
const envFile = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../.env.production')
  : path.join(__dirname, '../.env');
require('dotenv').config({ path: envFile });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initDb } = require('./models');
const storyRoutes = require('./routes/storyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Performance Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(compression());

// CORS configuration (supports local dev, Vercel deployments, and custom frontends)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Lazy DB initialization for serverless / cold starts
let initDbPromise = null;
const ensureDb = () => {
  if (!initDbPromise) {
    initDbPromise = initDb().catch(err => {
      console.error('[Database Init Error]', err);
      initDbPromise = null;
      throw err;
    });
  }
  return initDbPromise;
};

// Middleware: ensure database is synced before handling requests
app.use(async (req, res, next) => {
  // Health checks don't strictly require waiting for DB if we just want ping
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error('[DB Middleware Error]', err);
    res.status(500).json({ success: false, error: 'Database connection failed: ' + err.message });
  }
});

// Routes (supporting both /api/story and /story for flexible reverse proxies)
app.use('/api/story', storyRoutes);
app.use('/story', storyRoutes);

app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'online',
    system: 'AetherMaster AI Server',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'postgres' : 'mysql'),
    version: '2.0',
    timestamp: new Date()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

let server = null;
const startServer = async () => {
  await ensureDb();
  console.log(`[Database: ${(process.env.DB_DIALECT || 'mysql').toUpperCase()}] Synced & seeded successfully.`);
  return new Promise((resolve, reject) => {
    server = app.listen(PORT, () => {
      console.log(`[AetherMaster Server] Running at http://localhost:${PORT}`);
      resolve(server);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[AetherMaster Server] Port ${PORT} already active, reusing existing instance.`);
        resolve(null);
      } else {
        reject(err);
      }
    });
  });
};

if (require.main === module) {
  startServer().catch(err => {
    console.error('[Database Init Error]', err);
  });
}

module.exports = { app, startServer, ensureDb };

