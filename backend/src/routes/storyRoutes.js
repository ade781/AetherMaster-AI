const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const storyController = require('../controllers/storyController');
const saveLoadController = require('../controllers/saveLoadController');

// Rate limiter for LLM / narrative endpoints (Fase 6: Max 30 req/min per IP)
const storyAiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Terlalu banyak tindakan dalam waktu singkat. Mohon tunggu sejenak sebelum melanjutkan.'
  }
});

// Campaign & Story Flow Routes
router.get('/campaigns', storyController.getCampaigns);
router.post('/start', storyAiLimiter, storyController.startCampaign);
router.post('/action', storyAiLimiter, storyController.submitAction);
router.get('/action-stream', storyAiLimiter, storyController.actionStream);
router.post('/action-stream', storyAiLimiter, storyController.actionStream);
router.post('/combat/action', storyController.combatAction);
router.post('/use-item', storyController.useItem);
router.post('/rewind', storyController.rewindToNode);
router.get('/tree/:sessionId', storyController.getStoryTree);
router.get('/backlog/:sessionId', storyController.getBacklog);
router.get('/summary/:sessionId', storyController.getGameSummary);

// Multi-Slot Save / Load Routes
router.get('/saves', saveLoadController.getSaveSlots);
router.post('/saves/save', saveLoadController.saveToSlot);
router.get('/saves/load/:slotNumber', saveLoadController.loadFromSlot);
router.get('/saves/export/:sessionId', saveLoadController.exportSessionJson);
router.post('/saves/import', saveLoadController.importSessionJson);

module.exports = router;
