const saveLoadService = require('../services/saveLoadService');
const logger = require('../utils/logger');

exports.getSaveSlots = async (req, res) => {
  try {
    const slots = await saveLoadService.getSaveSlots();
    return res.json({ success: true, data: slots });
  } catch (err) {
    logger.error('getSaveSlots error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

exports.saveToSlot = async (req, res) => {
  try {
    const { sessionId, slotNumber, saveTitle } = req.body;
    const savedSession = await saveLoadService.saveToSlot({ sessionId, slotNumber, saveTitle });
    return res.json({
      success: true,
      message: `Berhasil disimpan ke Slot ${slotNumber}!`,
      data: savedSession
    });
  } catch (err) {
    logger.error('saveToSlot error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: err.message || 'Gagal menyimpan sesi.' });
  }
};

exports.loadFromSlot = async (req, res) => {
  try {
    const { slotNumber } = req.params;
    const result = await saveLoadService.loadFromSlot(slotNumber);
    return res.json({
      success: true,
      message: `Berhasil memuat Slot ${slotNumber}!`,
      data: result
    });
  } catch (err) {
    logger.error('loadFromSlot error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: err.message || 'Gagal memuat sesi simpanan.' });
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
    return res.status(statusCode).json({ success: false, error: err.message || 'Gagal mengekspor data simpanan.' });
  }
};

exports.importSessionJson = async (req, res) => {
  try {
    const { sessionData } = req.body;
    const result = await saveLoadService.importSessionJson(sessionData);
    return res.json({
      success: true,
      message: 'Petualangan berhasil diimpor!',
      data: result
    });
  } catch (err) {
    logger.error('importSessionJson error:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: err.message || 'Gagal mengimpor data simpanan.' });
  }
};
