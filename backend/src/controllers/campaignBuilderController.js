const campaignGeneratorService = require('../services/campaign/campaignGeneratorService');
const npcGeneratorService = require('../services/narrative/npcGeneratorService');
const { CustomCampaignRepository } = require('../repositories');
const { successResponse, errorResponse, ERROR_CODES } = require('../utils/apiResponse');
const logger = require('../utils/logger');

class CampaignBuilderController {
  async generateCampaign(req, res) {
    try {
      const { theme, difficulty, premise, lengthTier } = req.body || {};
      const generatedCampaign = await campaignGeneratorService.generateCampaign({
        theme,
        difficulty,
        premise,
        lengthTier
      });

      return successResponse(res, { generatedCampaign });
    } catch (err) {
      logger.error('[CampaignBuilderController.generateCampaign] Error:', err);
      return errorResponse(res, 500, ERROR_CODES.INTERNAL_ERROR, err.message || 'Gagal menghasilkan campaign.');
    }
  }

  async saveCustomCampaign(req, res) {
    try {
      const campaignData = req.body.campaignData || req.body;
      if (!campaignData || !campaignData.title) {
        return errorResponse(res, 400, ERROR_CODES.VALIDATION_FAILED, 'Data campaign tidak valid atau judul belum ditentukan.');
      }

      const id = campaignData.id || `camp_custom_${Math.random().toString(36).substring(2, 9)}`;

      const savedRecord = await CustomCampaignRepository.createCampaign({
        id,
        title: campaignData.title,
        premise: campaignData.premise || '',
        theme: campaignData.theme || 'Gothic Dungeon',
        difficulty: campaignData.difficulty || 'normal',
        nodesData: campaignData.nodes || [],
        npcPool: campaignData.npcPool || [],
        enemyPool: campaignData.presetEnemies || []
      });

      return res.status(201).json({
        success: true,
        data: {
          campaignId: savedRecord.id,
          savedAt: savedRecord.createdAt
        }
      });
    } catch (err) {
      logger.error('[CampaignBuilderController.saveCustomCampaign] Error:', err);
      return errorResponse(res, 500, ERROR_CODES.DATABASE_ERROR, err.message || 'Gagal menyimpan campaign kustom.');
    }
  }

  async getCustomCampaigns(req, res) {
    try {
      const records = await CustomCampaignRepository.findAll();
      const campaigns = records.map(c => ({
        id: c.id,
        title: c.title,
        theme: c.theme,
        difficulty: c.difficulty,
        createdAt: c.createdAt
      }));

      return successResponse(res, { campaigns });
    } catch (err) {
      logger.error('[CampaignBuilderController.getCustomCampaigns] Error:', err);
      return errorResponse(res, 500, ERROR_CODES.DATABASE_ERROR, err.message || 'Gagal mengambil daftar campaign kustom.');
    }
  }

  async generateNPC(req, res) {
    try {
      const { role, alignment, context } = req.body || {};
      const npc = await npcGeneratorService.generateNPC({ role, alignment, context });

      return successResponse(res, { npc });
    } catch (err) {
      logger.error('[CampaignBuilderController.generateNPC] Error:', err);
      return errorResponse(res, 500, ERROR_CODES.INTERNAL_ERROR, err.message || 'Gagal menghasilkan profil NPC dinamis.');
    }
  }
}

module.exports = new CampaignBuilderController();
