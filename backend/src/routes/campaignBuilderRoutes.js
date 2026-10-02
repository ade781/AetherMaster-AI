const express = require('express');
const router = express.Router();
const campaignBuilderController = require('../controllers/campaignBuilderController');

// Campaign Generator & Builder Endpoints
router.post('/generate', (req, res) => campaignBuilderController.generateCampaign(req, res));
router.post('/custom/save', (req, res) => campaignBuilderController.saveCustomCampaign(req, res));
router.get('/custom', (req, res) => campaignBuilderController.getCustomCampaigns(req, res));
router.post('/npcs/generate', (req, res) => campaignBuilderController.generateNPC(req, res));

module.exports = router;
