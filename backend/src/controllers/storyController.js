const storyService = require('../services/storyService');
const logger = require('../utils/logger');
const { errorResponse, successResponse, ERROR_CODES } = require('../utils/apiResponse');

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await storyService.getCampaigns();
    return successResponse(res, campaigns);
  } catch (err) {
    logger.error('[storyController.getCampaigns] Error:', err);
    return errorResponse(res, 500, ERROR_CODES.INTERNAL_ERROR, err.message || 'Internal server error');
  }
};

exports.startCampaign = async (req, res) => {
  try {
    const characterData = req.body.characterData || req.body.character || req.body || {};
    const campaignId = req.body.campaignId || characterData.campaignId;

    const result = await storyService.startCampaign({ campaignId, characterData });
    return successResponse(res, result);
  } catch (err) {
    logger.error('[storyController.startCampaign] Error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.INTERNAL_ERROR, err.message || 'Internal server error saat memulai kampanye.');
  }
};

exports.submitAction = async (req, res) => {
  try {
    const { sessionId, choiceId, customText, tone } = req.body;
    if (!sessionId) {
      return errorResponse(res, 400, ERROR_CODES.VALIDATION_FAILED, 'sessionId wajib disertakan.');
    }

    const result = await storyService.submitAction({ sessionId, choiceId, customText, tone });
    return successResponse(res, result);
  } catch (err) {
    logger.error('[storyController.submitAction] Error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.INVALID_ACTION, err.message || 'Internal server error saat memproses tindakan narasi.');
  }
};

exports.combatAction = async (req, res) => {
  try {
    const { sessionId, action, itemId } = req.body;
    if (!sessionId) {
      return errorResponse(res, 400, ERROR_CODES.VALIDATION_FAILED, 'sessionId wajib disertakan.');
    }

    const result = await storyService.combatAction({ sessionId, action, itemId });
    return successResponse(res, result.data, result.message);
  } catch (err) {
    logger.error('[storyController.combatAction] Error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.INVALID_ACTION, err.message || 'Internal server error saat memproses pertarungan.');
  }
};

exports.useItem = async (req, res) => {
  try {
    const { sessionId, itemId } = req.body;
    if (!sessionId || !itemId) {
      return errorResponse(res, 400, ERROR_CODES.VALIDATION_FAILED, 'sessionId dan itemId wajib disertakan.');
    }

    const result = await storyService.useItem({ sessionId, itemId });
    return successResponse(res, result.data, result.message);
  } catch (err) {
    logger.error('[storyController.useItem] Error:', err);
    const statusCode = err.statusCode || 400;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.VALIDATION_FAILED, err.message || 'Internal server error saat menggunakan item.');
  }
};

exports.rewindToNode = async (req, res) => {
  try {
    const { sessionId, targetNodeId } = req.body;
    if (!sessionId || !targetNodeId) {
      return errorResponse(res, 400, ERROR_CODES.VALIDATION_FAILED, 'sessionId dan targetNodeId wajib disertakan.');
    }

    const result = await storyService.rewindToNode({ sessionId, targetNodeId });
    return successResponse(res, result);
  } catch (err) {
    logger.error('[storyController.rewindToNode] Error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.INTERNAL_ERROR, err.message || 'Internal server error saat melakukan rewind.');
  }
};

exports.getStoryTree = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return errorResponse(res, 400, ERROR_CODES.VALIDATION_FAILED, 'sessionId wajib disertakan.');
    }

    const nodes = await storyService.getStoryTree(sessionId);
    return successResponse(res, nodes);
  } catch (err) {
    logger.error('[storyController.getStoryTree] Error:', err);
    return errorResponse(res, 500, ERROR_CODES.INTERNAL_ERROR, err.message || 'Internal server error');
  }
};

exports.getBacklog = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return errorResponse(res, 400, ERROR_CODES.VALIDATION_FAILED, 'sessionId wajib disertakan.');
    }

    const chain = await storyService.getBacklog(sessionId);
    return successResponse(res, chain);
  } catch (err) {
    logger.error('[storyController.getBacklog] Error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.INTERNAL_ERROR, err.message || 'Internal server error');
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return errorResponse(res, 400, ERROR_CODES.VALIDATION_FAILED, 'sessionId wajib disertakan.');
    }

    const data = await storyService.getSession(sessionId);
    return successResponse(res, data);
  } catch (err) {
    logger.error('[storyController.getSession] Error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.SESSION_NOT_FOUND, err.message || 'Internal server error saat memuat sesi aktif.');
  }
};

exports.getSessionSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return errorResponse(res, 400, ERROR_CODES.VALIDATION_FAILED, 'sessionId wajib disertakan.');
    }

    const data = await storyService.getSessionSummary(sessionId);
    return successResponse(res, data);
  } catch (err) {
    logger.error('[storyController.getSessionSummary] Error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.INTERNAL_ERROR, err.message || 'Internal server error saat memuat ringkasan sesi.');
  }
};
