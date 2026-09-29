const storyService = require('../services/storyService');
const logger = require('../utils/logger');

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await storyService.getCampaigns();
    return res.json({ success: true, data: campaigns });
  } catch (err) {
    logger.error('[storyController.getCampaigns] Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

exports.startCampaign = async (req, res) => {
  try {
    const characterData = req.body.characterData || req.body.character || req.body || {};
    const campaignId = req.body.campaignId || characterData.campaignId;

    const result = await storyService.startCampaign({ campaignId, characterData });
    return res.json({ success: true, data: result });
  } catch (err) {
    logger.error('[storyController.startCampaign] Error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error saat memulai kampanye.'
    });
  }
};

exports.submitAction = async (req, res) => {
  try {
    const { sessionId, choiceId, customText, tone } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
    }

    const result = await storyService.submitAction({ sessionId, choiceId, customText, tone });
    return res.json({ success: true, data: result });
  } catch (err) {
    logger.error('[storyController.submitAction] Error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error saat memproses tindakan narasi.'
    });
  }
};

exports.combatAction = async (req, res) => {
  try {
    const { sessionId, action, itemId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
    }

    const result = await storyService.combatAction({ sessionId, action, itemId });
    return res.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err) {
    logger.error('[storyController.combatAction] Error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error saat memproses pertarungan.'
    });
  }
};

exports.useItem = async (req, res) => {
  try {
    const { sessionId, itemId } = req.body;
    if (!sessionId || !itemId) {
      return res.status(400).json({ success: false, error: 'sessionId dan itemId wajib disertakan.' });
    }

    const result = await storyService.useItem({ sessionId, itemId });
    return res.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err) {
    logger.error('[storyController.useItem] Error:', err);
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error saat menggunakan item.'
    });
  }
};

exports.rewindToNode = async (req, res) => {
  try {
    const { sessionId, targetNodeId } = req.body;
    if (!sessionId || !targetNodeId) {
      return res.status(400).json({ success: false, error: 'sessionId dan targetNodeId wajib disertakan.' });
    }

    const result = await storyService.rewindToNode({ sessionId, targetNodeId });
    return res.json({ success: true, data: result });
  } catch (err) {
    logger.error('[storyController.rewindToNode] Error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error saat melakukan rewind.'
    });
  }
};

exports.getStoryTree = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
    }

    const nodes = await storyService.getStoryTree(sessionId);
    return res.json({ success: true, data: nodes });
  } catch (err) {
    logger.error('[storyController.getStoryTree] Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

exports.getBacklog = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
    }

    const chain = await storyService.getBacklog(sessionId);
    return res.json({ success: true, data: chain });
  } catch (err) {
    logger.error('[storyController.getBacklog] Error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: err.message || 'Internal server error' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
    }

    const data = await storyService.getSession(sessionId);
    return res.json({ success: true, data });
  } catch (err) {
    logger.error('[storyController.getSession] Error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error saat memuat sesi aktif.'
    });
  }
};

exports.getSessionSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
    }

    const data = await storyService.getSessionSummary(sessionId);
    return res.json({ success: true, data });
  } catch (err) {
    logger.error('[storyController.getSessionSummary] Error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error saat memuat ringkasan sesi.'
    });
  }
};
