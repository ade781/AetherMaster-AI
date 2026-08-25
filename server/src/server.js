const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/database');
const characterRoutes = require('./routes/characterRoutes');
const adventureRoutes = require('./routes/adventureRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/characters', characterRoutes);
app.use('/api/adventure', adventureRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AetherMaster AI Backend',
    database: process.env.DB_NAME || 'ai_dungeon_vtt',
    version: '2.0.0 (Phase 3 AI DM Enabled)',
    timestamp: new Date().toISOString(),
  });
});

// Start Server & Database
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`⚔️ [AetherMaster AI Backend] Active on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal Server Initialization Error:', error);
  }
};

startServer();
