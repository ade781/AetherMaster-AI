const express = require('express');
const router = express.Router();
const { handleAdventureAction } = require('../controllers/adventureController');

router.post('/chat', handleAdventureAction);

module.exports = router;
