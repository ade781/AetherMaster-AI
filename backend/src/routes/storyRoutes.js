const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const storyController = require('../controllers/storyController');
const saveLoadController = require('../controllers/saveLoadController');
const ttsController = require('../controllers/ttsController');

const { errorResponse, ERROR_CODES } = require('../utils/apiResponse');

// Rate limiter for LLM / narrative endpoints (Max 30 req/min per IP)
const storyAiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      429,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      'Terlalu banyak tindakan dalam waktu singkat. Mohon tunggu sejenak sebelum melanjutkan.'
    );
  }
});

// Campaign & Story Flow Routes
router.get('/campaigns', storyController.getCampaigns);
router.post('/start', storyAiLimiter, storyController.startCampaign);
router.post('/action', storyAiLimiter, storyController.submitAction);
router.post('/combat/action', storyController.combatAction);
router.post('/use-item', storyController.useItem);
router.get('/tree/:sessionId', storyController.getStoryTree);
router.post('/rewind', storyController.rewindToNode);
router.get('/backlog/:sessionId', storyController.getBacklog);
router.get('/session/:sessionId', storyController.getSession);
router.get('/summary/:sessionId', storyController.getSessionSummary);

// Multi-Slot Save / Load Routes
router.get('/saves', saveLoadController.getSaveSlots);
router.post('/saves/save', saveLoadController.saveToSlot);
router.post('/saves/autosave', saveLoadController.autoSave);
router.get('/saves/load/:slotNumber', saveLoadController.loadFromSlot);
router.get('/saves/export/:sessionId', saveLoadController.exportSessionJson);
router.post('/saves/import', saveLoadController.importSessionJson);

// Neural AI Text-to-Speech Route (Edge TTS)
router.all('/tts', ttsController.synthesizeSpeech);

module.exports = router;
