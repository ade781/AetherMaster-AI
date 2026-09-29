const saveLoadService = require('../services/saveLoadService');
const logger = require('../utils/logger');
const { errorResponse, successResponse, ERROR_CODES } = require('../utils/apiResponse');

exports.getSaveSlots = async (req, res) => {
  try {
    const slots = await saveLoadService.getSaveSlots();
    return successResponse(res, slots);
  } catch (err) {
    logger.error('getSaveSlots error:', err);
    return errorResponse(res, 500, ERROR_CODES.INTERNAL_ERROR, err.message || 'Internal server error');
  }
};

exports.saveToSlot = async (req, res) => {
  try {
    const { sessionId, slotNumber, saveTitle } = req.body;
    const savedSession = await saveLoadService.saveToSlot({ sessionId, slotNumber, saveTitle });
    return successResponse(res, savedSession, `Berhasil disimpan ke Slot ${slotNumber}!`);
  } catch (err) {
    logger.error('saveToSlot error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.SAVE_FAILED, err.message || 'Gagal menyimpan sesi.');
  }
};

exports.loadFromSlot = async (req, res) => {
  try {
    const { slotNumber } = req.params;
    const result = await saveLoadService.loadFromSlot(slotNumber);
    return successResponse(res, result, `Berhasil memuat Slot ${slotNumber}!`);
  } catch (err) {
    logger.error('loadFromSlot error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.LOAD_FAILED, err.message || 'Gagal memuat sesi simpanan.');
  }
};

exports.exportSessionJson = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const exportData = await saveLoadService.exportSessionJson(sessionId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=aethermaster_save_${exportData.character?.name || 'hero'}.json`);
    return res.json(exportData);
  } catch (err) {
    logger.error('exportSessionJson error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.INVALID_SAVE_FILE, err.message || 'Gagal mengekspor data simpanan.');
  }
};

exports.importSessionJson = async (req, res) => {
  try {
    const { sessionData } = req.body;
    const result = await saveLoadService.importSessionJson(sessionData);
    return successResponse(res, result, 'Petualangan berhasil diimpor!');
  } catch (err) {
    logger.error('importSessionJson error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.code || ERROR_CODES.INVALID_SAVE_FILE, err.message || 'Gagal mengimpor data simpanan.');
  }
};
