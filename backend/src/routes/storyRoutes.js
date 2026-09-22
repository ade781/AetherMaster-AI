const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const saveLoadController = require('../controllers/saveLoadController');

// Campaign & Story Flow Routes
router.get('/campaigns', storyController.getCampaigns);
router.post('/start', storyController.startCampaign);
router.post('/action', storyController.submitAction);
router.post('/rewind', storyController.rewindToNode);
router.get('/tree/:sessionId', storyController.getStoryTree);
router.get('/backlog/:sessionId', storyController.getBacklog);

// Multi-Slot Save / Load Routes
router.get('/saves', saveLoadController.getSaveSlots);
router.post('/saves/save', saveLoadController.saveToSlot);
router.get('/saves/load/:slotNumber', saveLoadController.loadFromSlot);
router.get('/saves/export/:sessionId', saveLoadController.exportSessionJson);
router.post('/saves/import', saveLoadController.importSessionJson);

module.exports = router;
