const { Character, Campaign, GameSession, StoryNode } = require('../models');

exports.getSaveSlots = async (req, res) => {
  try {
    const sessions = await GameSession.findAll({
      where: {
        slotNumber: [0, 1, 2, 3]
      },
      include: [Character, Campaign],
      order: [['slotNumber', 'ASC']]
    });

    const slots = {
      0: null, // Auto Save
      1: null, // Manual Slot 1
      2: null, // Manual Slot 2
      3: null  // Manual Slot 3
    };

    for (const sess of sessions) {
      const node = await StoryNode.findByPk(sess.currentSceneId);
      slots[sess.slotNumber] = {
        sessionId: sess.id,
        slotNumber: sess.slotNumber,
        saveTitle: sess.saveTitle || node?.chapterTitle || 'Simpanan Petualangan',
        savedAt: sess.savedAt || sess.updatedAt,
        characterName: sess.Character?.name,
        characterClass: sess.Character?.characterClass,
        hp: sess.Character?.hp,
        maxHp: sess.Character?.maxHp,
        gold: sess.Character?.gold,
        campaignTitle: sess.Campaign?.title,
        location: node?.location,
        backgroundId: node?.backgroundId,
        turnCount: sess.turnCount
      };
    }

    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.saveToSlot = async (req, res) => {
  try {
    const { sessionId, slotNumber, saveTitle } = req.body;
    const session = await GameSession.findByPk(sessionId, {
      include: [Character]
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan.' });
    }

    const slotNum = parseInt(slotNumber, 10);
    if (isNaN(slotNum) || slotNum < 0 || slotNum > 3) {
      return res.status(400).json({ success: false, error: 'Nomor slot tidak valid (0-3).' });
    }

    // If an existing session was assigned to this slot, destroy it to prevent bloat (except if it's the current session)
    const { Op } = require('sequelize');
    await GameSession.destroy({ 
      where: { 
        slotNumber: slotNum,
        id: { [Op.ne]: sessionId }
      } 
    });

    session.slotNumber = slotNum;
    session.saveTitle = saveTitle || `Slot ${slotNum}: ${session.Character?.name} (Turn ${session.turnCount})`;
    session.savedAt = new Date();
    await session.save();

    res.json({ success: true, message: `Berhasil disimpan ke Slot ${slotNum}!`, data: session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.loadFromSlot = async (req, res) => {
  try {
    const { slotNumber } = req.params;
    const session = await GameSession.findOne({
      where: { slotNumber: parseInt(slotNumber, 10) },
      include: [Character, Campaign]
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Data simpanan di slot ini kosong.' });
    }

    const currentNode = await StoryNode.findByPk(session.currentSceneId);

    res.json({
      success: true,
      data: {
        session,
        character: session.Character,
        campaign: session.Campaign,
        currentNode
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.exportSessionJson = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan.' });

    const nodes = await StoryNode.findAll({
      where: { sessionId },
      order: [['createdAt', 'ASC']]
    });

    const exportData = {
      exportVersion: '2.0',
      exportedAt: new Date().toISOString(),
      session,
      character: session.Character,
      campaign: session.Campaign,
      nodes
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=aethermaster_save_${session.Character?.name || 'hero'}.json`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.importSessionJson = async (req, res) => {
  try {
    const { sessionData } = req.body;
    if (!sessionData || !sessionData.character || !sessionData.nodes) {
      return res.status(400).json({ success: false, error: 'Format data JSON tidak valid.' });
    }

    // Recreate character
    const charData = sessionData.character;
    delete charData.id;
    const character = await Character.create(charData);

    // Recreate session
    const sessData = sessionData.session;
    delete sessData.id;
    sessData.characterId = character.id;
    const newSession = await GameSession.create(sessData);

    // Recreate nodes mapping old IDs to new UUIDs
    const idMap = {};
    for (const nodeData of sessionData.nodes) {
      const oldId = nodeData.id;
      delete nodeData.id;
      nodeData.sessionId = newSession.id;
      nodeData.parentNodeId = nodeData.parentNodeId ? idMap[nodeData.parentNodeId] || null : null;
      const newNode = await StoryNode.create(nodeData);
      idMap[oldId] = newNode.id;
    }

    const currentSceneOldId = sessionData.session?.currentSceneId;
    if (currentSceneOldId && idMap[currentSceneOldId]) {
      newSession.currentSceneId = idMap[currentSceneOldId];
      await newSession.save();
    }

    const currentNode = await StoryNode.findByPk(newSession.currentSceneId);

    res.json({
      success: true,
      message: 'Save game berhasil diimpor!',
      data: {
        session: newSession,
        character,
        campaign: sessionData.campaign,
        currentNode
      }
    });
  } catch (err) {
    console.error('importSessionJson error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
