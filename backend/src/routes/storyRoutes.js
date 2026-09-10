const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');

// Campaign endpoints
router.get('/campaigns', storyController.getCampaigns);
router.post('/campaigns/forge', storyController.forgeCampaign);
router.post('/campaigns/start', storyController.startCampaignSession);

// Branching story endpoints
router.post('/choice', storyController.chooseBranchAction);
router.get('/tree/:sessionId', storyController.getSessionTree);
router.post('/rewind/:sceneId', storyController.rewindToScene);

// Session persistence endpoints
router.get('/sessions', storyController.getSessions);
router.get('/sessions/:id', storyController.loadSession);
router.delete('/sessions/:id', storyController.deleteSession);

// Backward compatibility start endpoint
router.post('/start', storyController.startCampaignSession);

module.exports = router;
