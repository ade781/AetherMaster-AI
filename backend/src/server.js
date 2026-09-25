const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initDb } = require('./models');
const storyRoutes = require('./routes/storyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Performance Middlewares (Fase 6)
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(compression());

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/story', storyRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AetherMaster AI Local Server',
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
  await initDb();
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

module.exports = { app, startServer };
