const { sequelize, Character, Campaign, GameSession, StoryNode } = require('../models');
const { gameStateEngine, worldLedgerService } = require('../engine');

exports.getSaveSlots = async (req, res) => {
  try {
    const sessions = await GameSession.findAll({
      where: {
        slotNumber: [0, 1, 2, 3, 4, 5]
      },
      include: [Character, Campaign],
      order: [['slotNumber', 'ASC']]
    });

    const slots = {
      0: null, // Auto Save
      1: null, // Manual Slot 1
      2: null, // Manual Slot 2
      3: null, // Manual Slot 3
      4: null, // Manual Slot 4
      5: null  // Manual Slot 5
    };

    const sceneIds = sessions.map(s => s.currentSceneId).filter(Boolean);
    const nodes = await StoryNode.findAll({ where: { id: sceneIds } });
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    for (const sess of sessions) {
      const node = nodeMap.get(sess.currentSceneId);
      slots[sess.slotNumber] = {
        sessionId: sess.id,
        slotNumber: sess.slotNumber,
        saveTitle: sess.saveTitle || node?.chapterTitle || 'Simpanan Petualangan',
        savedAt: sess.savedAt || sess.updatedAt,
        characterName: sess.Character?.name,
        characterClass: sess.Character?.characterClass,
        hp: sess.Character?.hp,
        maxHp: sess.Character?.maxHp,
        mana: sess.Character?.mana,
        maxMana: sess.Character?.maxMana,
        gold: sess.Character?.gold,
        campaignTitle: sess.Campaign?.title,
        location: node?.location,
        backgroundId: node?.backgroundId,
        turnCount: sess.turnCount
      };
    }

    res.json({ success: true, data: slots });
  } catch (err) {
    console.error('getSaveSlots error:', err);
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
    if (isNaN(slotNum) || slotNum < 0 || slotNum > 5) {
      return res.status(400).json({ success: false, error: 'Nomor slot tidak valid (0-5).' });
    }

    // Atomic transaction for clean slot replacement and 2-stage node cloning
    const savedSession = await sequelize.transaction(async (t) => {
      // 1. Clean previous sessions stored in this slot
      const oldSlotSessions = await GameSession.findAll({
        where: { slotNumber: slotNum },
        transaction: t
      });

      for (const oldSess of oldSlotSessions) {
        await StoryNode.destroy({ where: { sessionId: oldSess.id }, transaction: t });
        await GameSession.destroy({ where: { id: oldSess.id }, transaction: t });
        if (oldSess.characterId) {
          await Character.destroy({ where: { id: oldSess.characterId }, transaction: t }).catch(() => {});
        }
      }

      // 2. Clone character snapshot
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
        armorClass: session.Character.armorClass,
        str: session.Character.str,
        dex: session.Character.dex,
        int: session.Character.int,
        wis: session.Character.wis,
        cha: session.Character.cha,
        con: session.Character.con,
        avatarUrl: session.Character.avatarUrl,
        inventory: [...(session.Character.inventory || [])],
        equippedItems: [...(session.Character.equippedItems || [])],
        statusEffects: [...(session.Character.statusEffects || [])]
      }, { transaction: t });

      // 3. Create frozen slot session
      const newSlotSession = await GameSession.create({
        campaignId: session.campaignId,
        characterId: charClone.id,
        turnCount: session.turnCount,
        worldLedger: worldLedgerService.normalizeLedger(session.worldLedger),
        missionLog: session.missionLog ? JSON.parse(JSON.stringify(session.missionLog)) : null,
        combatState: session.combatState ? JSON.parse(JSON.stringify(session.combatState)) : null,
        isGameOver: session.isGameOver,
        slotNumber: slotNum,
        saveTitle: saveTitle || `Slot ${slotNum}: ${session.Character.name} (Babak ke-${session.turnCount})`,
        savedAt: new Date()
      }, { transaction: t });

      // 4. Fetch all original nodes for this session
      const originalNodes = await StoryNode.findAll({
        where: { sessionId: session.id },
        order: [['createdAt', 'ASC']],
        transaction: t
      });

      // 5. Two-Stage Node Cloning to resolve all parent-child hierarchies without ordering bugs
      const idMap = {};
      const nodePairs = [];

      // Stage 1: Create all nodes with parentNodeId: null
      for (const node of originalNodes) {
        const clonedNode = await StoryNode.create({
          sessionId: newSlotSession.id,
          parentNodeId: null,
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
          characterSnapshot: node.characterSnapshot,
          gameStateSnapshot: node.gameStateSnapshot || node.characterSnapshot
        }, { transaction: t });

        idMap[node.id] = clonedNode.id;
        nodePairs.push({ clonedNode, originalParentId: node.parentNodeId });
      }

      // Stage 2: Link parent IDs using complete idMap
      for (const { clonedNode, originalParentId } of nodePairs) {
        if (originalParentId && idMap[originalParentId]) {
          clonedNode.parentNodeId = idMap[originalParentId];
          await clonedNode.save({ transaction: t });
        }
      }

      // 6. Map currentSceneId
      if (session.currentSceneId && idMap[session.currentSceneId]) {
        newSlotSession.currentSceneId = idMap[session.currentSceneId];
        await newSlotSession.save({ transaction: t });
      }

      return newSlotSession;
    });

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

    // Atomic transaction for loading into a new active playable session
    const { activeSession, activeChar, currentNode } = await sequelize.transaction(async (t) => {
      // 1. Clone from the frozen slot into an active playable character
      const charClone = await Character.create({
        name: slotSess.Character.name,
        race: slotSess.Character.race,
        characterClass: slotSess.Character.characterClass,
        level: slotSess.Character.level,
        hp: slotSess.Character.hp,
        maxHp: slotSess.Character.maxHp,
        mana: slotSess.Character.mana,
        maxMana: slotSess.Character.maxMana,
        gold: slotSess.Character.gold,
        armorClass: slotSess.Character.armorClass,
        str: slotSess.Character.str,
        dex: slotSess.Character.dex,
        int: slotSess.Character.int,
        wis: slotSess.Character.wis,
        cha: slotSess.Character.cha,
        con: slotSess.Character.con,
        avatarUrl: slotSess.Character.avatarUrl,
        inventory: [...(slotSess.Character.inventory || [])],
        equippedItems: [...(slotSess.Character.equippedItems || [])],
        statusEffects: [...(slotSess.Character.statusEffects || [])]
      }, { transaction: t });

      // 2. Create active session
      const newActiveSession = await GameSession.create({
        campaignId: slotSess.campaignId,
        characterId: charClone.id,
        turnCount: slotSess.turnCount,
        worldLedger: worldLedgerService.normalizeLedger(slotSess.worldLedger),
        missionLog: slotSess.missionLog ? JSON.parse(JSON.stringify(slotSess.missionLog)) : null,
        combatState: slotSess.combatState ? JSON.parse(JSON.stringify(slotSess.combatState)) : null,
        isGameOver: Boolean(slotSess.isGameOver),
        slotNumber: null
      }, { transaction: t });

      // 3. Two-stage node cloning for active session
      const slotNodes = await StoryNode.findAll({
        where: { sessionId: slotSess.id },
        order: [['createdAt', 'ASC']],
        transaction: t
      });

      const idMap = {};
      const nodePairs = [];

      for (const node of slotNodes) {
        const newNode = await StoryNode.create({
          sessionId: newActiveSession.id,
          parentNodeId: null,
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
          characterSnapshot: node.characterSnapshot,
          gameStateSnapshot: node.gameStateSnapshot || node.characterSnapshot
        }, { transaction: t });

        idMap[node.id] = newNode.id;
        nodePairs.push({ newNode, originalParentId: node.parentNodeId });
      }

      for (const { newNode, originalParentId } of nodePairs) {
        if (originalParentId && idMap[originalParentId]) {
          newNode.parentNodeId = idMap[originalParentId];
          await newNode.save({ transaction: t });
        }
      }

      if (slotSess.currentSceneId && idMap[slotSess.currentSceneId]) {
        newActiveSession.currentSceneId = idMap[slotSess.currentSceneId];
        await newActiveSession.save({ transaction: t });
      }

      const activeCurrentNode = await StoryNode.findByPk(newActiveSession.currentSceneId, {
        transaction: t
      });

      return {
        activeSession: newActiveSession,
        activeChar: charClone,
        currentNode: activeCurrentNode
      };
    });

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
    console.error('exportSessionJson error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.importSessionJson = async (req, res) => {
  try {
    const { sessionData } = req.body;
    if (!sessionData || !sessionData.character || !sessionData.nodes) {
      return res.status(400).json({ success: false, error: 'Format data JSON tidak valid.' });
    }

    const { newSession, character, currentNode } = await sequelize.transaction(async (t) => {
      // Recreate character
      const charData = { ...sessionData.character };
      delete charData.id;
      const createdChar = await Character.create(charData, { transaction: t });

      // Recreate session
      const sessData = { ...sessionData.session };
      delete sessData.id;
      sessData.characterId = createdChar.id;
      sessData.worldLedger = worldLedgerService.normalizeLedger(sessData.worldLedger);
      const createdSession = await GameSession.create(sessData, { transaction: t });

      // Recreate nodes mapping old IDs to new UUIDs with two-pass parent resolution
      const idMap = {};
      const createdNodes = [];

      for (const rawNodeData of sessionData.nodes) {
        const oldId = rawNodeData.id;
        const oldParentId = rawNodeData.parentNodeId;
        const nodeData = { ...rawNodeData };
        delete nodeData.id;
        delete nodeData.createdAt;
        delete nodeData.updatedAt;
        nodeData.sessionId = createdSession.id;
        nodeData.parentNodeId = null;
        nodeData.gameStateSnapshot = nodeData.gameStateSnapshot || nodeData.characterSnapshot;

        const newNode = await StoryNode.create(nodeData, { transaction: t });
        idMap[oldId] = newNode.id;
        createdNodes.push({ newNode, oldParentId });
      }

      for (const { newNode, oldParentId } of createdNodes) {
        if (oldParentId && idMap[oldParentId]) {
          newNode.parentNodeId = idMap[oldParentId];
          await newNode.save({ transaction: t });
        }
      }

      const currentSceneOldId = sessionData.session?.currentSceneId;
      if (currentSceneOldId && idMap[currentSceneOldId]) {
        createdSession.currentSceneId = idMap[currentSceneOldId];
        await createdSession.save({ transaction: t });
      }

      const activeCurrentNode = await StoryNode.findByPk(createdSession.currentSceneId, {
        transaction: t
      });

      return {
        newSession: createdSession,
        character: createdChar,
        currentNode: activeCurrentNode
      };
    });

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

/**
 * Atomic Rewind Controller Handler
 * Uses gameStateEngine.restoreSnapshot within a database transaction.
 * Strictly guarantees exact HP restore (never arbitrarily 50%), inventory, worldLedger, and missionLog.
 */
exports.rewindToNode = async (req, res) => {
  try {
    const { sessionId, targetNodeId } = req.body;
    if (!sessionId || !targetNodeId) {
      return res.status(400).json({ success: false, error: 'sessionId dan targetNodeId wajib disertakan.' });
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character]
    });
    if (!session || !session.Character) {
      return res.status(404).json({ success: false, error: 'Sesi atau karakter tidak ditemukan.' });
    }

    const targetNode = await StoryNode.findOne({
      where: { id: targetNodeId, sessionId }
    });
    if (!targetNode) {
      return res.status(404).json({ success: false, error: 'Node target tidak valid untuk sesi ini.' });
    }

    const result = await sequelize.transaction(async (t) => {
      return await gameStateEngine.restoreSnapshot(targetNode, session, session.Character, t);
    });

    return res.json({
      success: true,
      message: 'Berhasil melakukan rewind ke babak yang dipilih!',
      data: {
        session: result.session,
        character: result.character,
        currentNode: targetNode
      }
    });
  } catch (err) {
    console.error('rewindToNode error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
