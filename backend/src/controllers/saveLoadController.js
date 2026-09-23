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
    if (!session || !session.Character) {
      return res.status(404).json({ success: false, error: 'Sesi atau karakter tidak ditemukan.' });
    }

    const slotNum = parseInt(slotNumber, 10);
    if (isNaN(slotNum) || slotNum < 0 || slotNum > 3) {
      return res.status(400).json({ success: false, error: 'Nomor slot tidak valid (0-3).' });
    }

    // Clean previous session stored in this slot
    const oldSlotSessions = await GameSession.findAll({ where: { slotNumber: slotNum } });
    for (const oldSess of oldSlotSessions) {
      await GameSession.destroy({ where: { id: oldSess.id } });
    }

    // Clone character snapshot
    const charClone = await Character.create({
      name: session.Character.name,
      race: session.Character.race,
      characterClass: session.Character.characterClass,
      level: session.Character.level,
      hp: session.Character.hp,
      maxHp: session.Character.maxHp,
      mana: session.Character.mana,
      maxMana: session.Character.maxMana,
      gold: session.Character.gold,
      str: session.Character.str,
      dex: session.Character.dex,
      int: session.Character.int,
      wis: session.Character.wis,
      cha: session.Character.cha,
      con: session.Character.con,
      avatarUrl: session.Character.avatarUrl,
      inventory: [...(session.Character.inventory || [])],
      statusEffects: [...(session.Character.statusEffects || [])]
    });

    // Create frozen slot session
    const savedSession = await GameSession.create({
      campaignId: session.campaignId,
      characterId: charClone.id,
      turnCount: session.turnCount,
      worldLedger: JSON.parse(JSON.stringify(session.worldLedger || {})),
      isGameOver: session.isGameOver,
      slotNumber: slotNum,
      saveTitle: saveTitle || `Slot ${slotNum}: ${session.Character.name} (Babak ke-${session.turnCount})`,
      savedAt: new Date()
    });

    // Clone all nodes for this session
    const originalNodes = await StoryNode.findAll({
      where: { sessionId: session.id },
      order: [['createdAt', 'ASC']]
    });

    const idMap = {};
    for (const node of originalNodes) {
      const newNode = await StoryNode.create({
        sessionId: savedSession.id,
        parentNodeId: node.parentNodeId ? (idMap[node.parentNodeId] || null) : null,
        chapterTitle: node.chapterTitle,
        location: node.location,
        backgroundId: node.backgroundId,
        speaker: node.speaker,
        characterId: node.characterId,
        mood: node.mood,
        dialogueText: node.dialogueText,
        consequenceNote: node.consequenceNote,
        choices: node.choices,
        combatEncounter: node.combatEncounter,
        characterSnapshot: node.characterSnapshot
      });
      idMap[node.id] = newNode.id;
    }

    if (session.currentSceneId && idMap[session.currentSceneId]) {
      savedSession.currentSceneId = idMap[session.currentSceneId];
      await savedSession.save();
    }

    res.json({
      success: true,
      message: `Berhasil disimpan ke Slot ${slotNum}!`,
      data: savedSession
    });
  } catch (err) {
    console.error('saveToSlot error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.loadFromSlot = async (req, res) => {
  try {
    const { slotNumber } = req.params;
    const slotSess = await GameSession.findOne({
      where: { slotNumber: parseInt(slotNumber, 10) },
      include: [Character, Campaign]
    });
    if (!slotSess || !slotSess.Character) {
      return res.status(404).json({ success: false, error: 'Data simpanan di slot ini kosong.' });
    }

    // Clone from the frozen slot into an active playable session (slotNumber: null)
    const activeChar = await Character.create({
      name: slotSess.Character.name,
      race: slotSess.Character.race,
      characterClass: slotSess.Character.characterClass,
      level: slotSess.Character.level,
      hp: slotSess.Character.hp,
      maxHp: slotSess.Character.maxHp,
      mana: slotSess.Character.mana,
      maxMana: slotSess.Character.maxMana,
      gold: slotSess.Character.gold,
      str: slotSess.Character.str,
      dex: slotSess.Character.dex,
      int: slotSess.Character.int,
      wis: slotSess.Character.wis,
      cha: slotSess.Character.cha,
      con: slotSess.Character.con,
      avatarUrl: slotSess.Character.avatarUrl,
      inventory: [...(slotSess.Character.inventory || [])],
      statusEffects: [...(slotSess.Character.statusEffects || [])]
    });

    const activeSession = await GameSession.create({
      campaignId: slotSess.campaignId,
      characterId: activeChar.id,
      turnCount: slotSess.turnCount,
      worldLedger: JSON.parse(JSON.stringify(slotSess.worldLedger || {})),
      isGameOver: false,
      slotNumber: null
    });

    const slotNodes = await StoryNode.findAll({
      where: { sessionId: slotSess.id },
      order: [['createdAt', 'ASC']]
    });

    const idMap = {};
    for (const node of slotNodes) {
      const newNode = await StoryNode.create({
        sessionId: activeSession.id,
        parentNodeId: node.parentNodeId ? (idMap[node.parentNodeId] || null) : null,
        chapterTitle: node.chapterTitle,
        location: node.location,
        backgroundId: node.backgroundId,
        speaker: node.speaker,
        characterId: node.characterId,
        mood: node.mood,
        dialogueText: node.dialogueText,
        consequenceNote: node.consequenceNote,
        choices: node.choices,
        combatEncounter: node.combatEncounter,
        characterSnapshot: node.characterSnapshot
      });
      idMap[node.id] = newNode.id;
    }

    if (slotSess.currentSceneId && idMap[slotSess.currentSceneId]) {
      activeSession.currentSceneId = idMap[slotSess.currentSceneId];
      await activeSession.save();
    }

    const currentNode = await StoryNode.findByPk(activeSession.currentSceneId);

    res.json({
      success: true,
      message: `Berhasil memuat Slot ${slotNumber}!`,
      data: {
        session: activeSession,
        character: activeChar,
        campaign: slotSess.Campaign,
        currentNode
      }
    });
  } catch (err) {
    console.error('loadFromSlot error:', err);
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
