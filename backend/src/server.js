const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initModels } = require('./models');
const storyRoutes = require('./routes/storyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/story', storyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AetherMaster AI Visual Novel Engine',
    database: 'Sequelize Relational Connected',
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    timestamp: new Date().toISOString(),
  });
});

// Start Database & Server
const startServer = async () => {
  try {
    await initModels();
    app.listen(PORT, () => {
      console.log(`⚔️ [AetherMaster AI Backend] Active on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal initialization error:', error.message);
    process.exit(1);
  }
};

startServer();
