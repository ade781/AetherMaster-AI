const { Campaign, StoryScene, StorySession } = require('../models');
const geminiService = require('../services/geminiService');

// Get list of all campaigns (presets & custom)
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      order: [['isCustom', 'ASC'], ['createdAt', 'DESC']],
    });
    return res.json({ success: true, campaigns });
  } catch (error) {
    console.error('Error getting campaigns:', error);
    return res.status(500).json({ error: error.message });
  }
};

// AI Quest Forge: Forge a new custom campaign from player prompt
const forgeCampaign = async (req, res) => {
  try {
    const { premise, genre } = req.body;
    if (!premise || !premise.trim()) {
      return res.status(400).json({ error: 'Premis ide petualangan diperlukan.' });
    }

    const forged = await geminiService.forgeCustomCampaign({ premise, genre });
    const id = `custom_${Date.now()}`;

    const campaign = await Campaign.create({
      id,
      title: forged.title || 'Petualangan Tempaan AI',
      premise: forged.premise || premise,
      genre: forged.genre || genre || 'dark_fantasy',
      icon: forged.icon || '✨',
      isCustom: true,
    });

    return res.json({ success: true, campaign });
  } catch (error) {
    console.error('Error forging campaign:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Start a campaign session (Creates root StoryScene with parentId: null)
const startCampaignSession = async (req, res) => {
  try {
    const { campaignId, sessionId } = req.body;
    const cid = campaignId || 'whispering_tavern';
    const sid = sessionId || `session_${Date.now()}`;

    const campaign = await Campaign.findByPk(cid);
    if (!campaign) {
      return res.status(404).json({ error: 'Kampanye tidak ditemukan.' });
    }

    const { scene, source } = await geminiService.generateCampaignOpening(campaign);

    const rootSceneId = `scene_${Date.now()}_root`;

    // Create root scene in relational StoryScene table
    const rootScene = await StoryScene.create({
      id: rootSceneId,
      campaignId: cid,
      sessionId: sid,
      parentId: null,
      choiceTrigger: null,
      chapterTitle: scene.chapterTitle,
      location: scene.location,
      speaker: scene.speaker,
      mood: scene.mood,
      dialogue: scene.dialogue,
      consequenceNote: scene.consequenceNote,
      choices: scene.choices,
    });

    // Also update StorySession for quick list
    await StorySession.upsert({
      id: sid,
      title: `${campaign.title} - ${scene.chapterTitle}`,
      location: scene.location,
      currentScene: { ...scene, id: rootSceneId },
      history: [],
    });

    return res.json({
      success: true,
      campaign,
      sessionId: sid,
      scene: { ...scene, id: rootSceneId },
      source,
    });
  } catch (error) {
    console.error('Error starting campaign session:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Advance story to next branch (Stores new StoryScene linked to parentId)
const chooseBranchAction = async (req, res) => {
  try {
    const { campaignId, sessionId, parentSceneId, choiceText, previousScene, history = [] } = req.body;

    if (!choiceText) {
      return res.status(400).json({ error: 'Pilihan aksi pemain diperlukan.' });
    }

    const campaign = await Campaign.findByPk(campaignId || 'whispering_tavern');

    const { scene, source } = await geminiService.generateNextBranch({
      campaign,
      previousScene,
      choiceText,
      history,
    });

    const newSceneId = `scene_${Date.now()}`;

    // Insert new branch node into relational StoryScene table
    const savedScene = await StoryScene.create({
      id: newSceneId,
      campaignId: campaignId || 'whispering_tavern',
      sessionId: sessionId || `session_${Date.now()}`,
      parentId: parentSceneId || null,
      choiceTrigger: choiceText,
      chapterTitle: scene.chapterTitle,
      location: scene.location,
      speaker: scene.speaker,
      mood: scene.mood,
      dialogue: scene.dialogue,
      consequenceNote: scene.consequenceNote,
      choices: scene.choices,
    });

    const updatedHistory = [
      ...history,
      {
        id: parentSceneId,
        ...previousScene,
        chosenAction: choiceText,
      }
    ];

    if (sessionId) {
      await StorySession.upsert({
        id: sessionId,
        title: `${campaign?.title || 'Petualangan'} - ${scene.chapterTitle}`,
        location: scene.location,
        currentScene: { ...scene, id: newSceneId },
        history: updatedHistory,
      });
    }

    return res.json({
      success: true,
      sessionId,
      scene: { ...scene, id: newSceneId },
      history: updatedHistory,
      source,
    });
  } catch (error) {
    console.error('Error choosing branch action:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Retrieve relational branching tree for this session
const getSessionTree = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const scenes = await StoryScene.findAll({
      where: { sessionId },
      attributes: ['id', 'parentId', 'choiceTrigger', 'chapterTitle', 'location', 'speaker', 'mood', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });

    return res.json({ success: true, nodes: scenes });
  } catch (error) {
    console.error('Error getting session tree:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Rewind to an earlier scene node in the branching tree
const rewindToScene = async (req, res) => {
  try {
    const { sceneId } = req.params;
    const targetScene = await StoryScene.findByPk(sceneId);

    if (!targetScene) {
      return res.status(404).json({ error: 'Adegan target tidak ditemukan di pohon cerita.' });
    }

    // Trace ancestors back to root to construct valid history
    let current = targetScene;
    const tracedHistory = [];

    while (current && current.parentId) {
      const parent = await StoryScene.findByPk(current.parentId);
      if (parent) {
        tracedHistory.unshift({
          id: parent.id,
          chapterTitle: parent.chapterTitle,
          location: parent.location,
          speaker: parent.speaker,
          dialogue: parent.dialogue,
          chosenAction: current.choiceTrigger,
        });
      }
      current = parent;
    }

    // Format target scene for frontend
    const sceneData = {
      id: targetScene.id,
      chapterTitle: targetScene.chapterTitle,
      location: targetScene.location,
      speaker: targetScene.speaker,
      mood: targetScene.mood,
      dialogue: targetScene.dialogue,
      consequenceNote: targetScene.consequenceNote,
      choices: targetScene.choices,
    };

    // Update StorySession state
    if (targetScene.sessionId) {
      await StorySession.upsert({
        id: targetScene.sessionId,
        title: targetScene.chapterTitle,
        location: targetScene.location,
        currentScene: sceneData,
        history: tracedHistory,
      });
    }

    return res.json({
      success: true,
      scene: sceneData,
      history: tracedHistory,
    });
  } catch (error) {
    console.error('Error rewinding to scene:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Legacy/Compatibility Sessions
const getSessions = async (req, res) => {
  try {
    const sessions = await StorySession.findAll({
      attributes: ['id', 'title', 'location', 'updatedAt', 'createdAt'],
      order: [['updatedAt', 'DESC']],
    });
    return res.json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const loadSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await StorySession.findByPk(id);
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan.' });
    return res.json({ success: true, session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    await StoryScene.destroy({ where: { sessionId: id } });
    const deleted = await StorySession.destroy({ where: { id } });
    return res.json({ success: true, deleted: !!deleted });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCampaigns,
  forgeCampaign,
  startCampaignSession,
  chooseBranchAction,
  getSessionTree,
  rewindToScene,
  getSessions,
  loadSession,
  deleteSession,
};
