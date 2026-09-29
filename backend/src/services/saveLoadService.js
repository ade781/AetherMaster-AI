const {
  sequelize,
  Character,
  Campaign,
  GameSession,
  StoryNode,
  StoryChoice,
  StorySnapshot,
  WorldFact
} = require('../models');
const { worldLedgerService } = require('../engine');
const { ItemRepository } = require('../repositories');

class SaveLoadService {
  async getSaveSlots() {
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
        turnCount: sess.turnCount,
        activeBranchId: sess.activeBranchId || 'main'
      };
    }

    return slots;
  }

  async saveToSlot({ sessionId, slotNumber, saveTitle }) {
    if (!sessionId) {
      const err = new Error('sessionId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const slotNum = parseInt(slotNumber, 10);
    if (isNaN(slotNum) || slotNum < 1 || slotNum > 3) {
      const err = new Error('Nomor slot tidak valid. Penyimpanan manual hanya diizinkan untuk Slot 1, 2, dan 3 (Slot 0 dikhususkan untuk auto-save).');
      err.statusCode = 400;
      throw err;
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character]
    });
    if (!session || !session.Character) {
      const err = new Error('Sesi atau karakter tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

    return await sequelize.transaction(async (t) => {
      // 1. Clean previous sessions stored in this slot
      const oldSlotSessions = await GameSession.findAll({
        where: { slotNumber: slotNum },
        transaction: t
      });

      for (const oldSess of oldSlotSessions) {
        await WorldFact.destroy({ where: { sessionId: oldSess.id }, transaction: t });
        const oldNodes = await StoryNode.findAll({ where: { sessionId: oldSess.id }, attributes: ['id'], transaction: t });
        const oldNodeIds = oldNodes.map(n => n.id);
        if (oldNodeIds.length > 0) {
          await StoryChoice.destroy({ where: { storyNodeId: oldNodeIds }, transaction: t });
          await StorySnapshot.destroy({ where: { storyNodeId: oldNodeIds }, transaction: t });
        }
        await StoryNode.destroy({ where: { sessionId: oldSess.id }, transaction: t });
        await GameSession.destroy({ where: { id: oldSess.id }, transaction: t });
        if (oldSess.characterId) {
          await Character.destroy({ where: { id: oldSess.characterId }, transaction: t }).catch(() => {});
        }
      }

      // 2. Clone character with canonical inventory references
      const canonicalInv = ItemRepository.normalizeInventory(session.Character.inventory);
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
        inventory: canonicalInv,
        equippedItems: [...(session.Character.equippedItems || [])],
        statusEffects: [...(session.Character.statusEffects || [])]
      }, { transaction: t });

      // 3. Create frozen slot session with full graph attributes
      const newSlotSession = await GameSession.create({
        campaignId: session.campaignId,
        characterId: charClone.id,
        turnCount: session.turnCount,
        activeBranchId: session.activeBranchId || 'main',
        questState: session.questState || {},
        worldLedger: worldLedgerService.normalizeLedger(session.worldLedger),
        missionLog: session.missionLog ? JSON.parse(JSON.stringify(session.missionLog)) : null,
        combatState: session.combatState ? JSON.parse(JSON.stringify(session.combatState)) : null,
        isGameOver: session.isGameOver,
        slotNumber: slotNum,
        saveTitle: saveTitle || `Slot ${slotNum}: ${session.Character.name} (Babak ke-${session.turnCount})`,
        savedAt: new Date()
      }, { transaction: t });

      // 4. Fetch all original nodes with choices and snapshots
      const originalNodes = await StoryNode.findAll({
        where: { sessionId: session.id },
        order: [['createdAt', 'ASC']],
        include: [
          { model: StoryChoice, as: 'choiceList' },
          { model: StorySnapshot, as: 'snapshot' }
        ],
        transaction: t
      });

      // 5. Two-Stage Node Cloning
      const idMap = {};
      const nodePairs = [];

      for (const node of originalNodes) {
        const clonedNode = await StoryNode.create({
          sessionId: newSlotSession.id,
          parentNodeId: null,
          branchId: node.branchId || 'main',
          status: node.status || 'ACTIVE',
          chapterTitle: node.chapterTitle,
          location: node.location,
          locationId: node.locationId,
          backgroundId: node.backgroundId,
          speaker: node.speaker,
          speakerId: node.speakerId,
          characterId: node.characterId,
          turnNumber: node.turnNumber,
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

        const choices = node.choiceList || node.choices || [];
        if (Array.isArray(choices) && choices.length > 0) {
          const choiceRecords = choices.map((c, idx) => ({
            storyNodeId: clonedNode.id,
            choiceKey: c.choiceKey || c.id || `c_${idx + 1}`,
            text: c.text,
            actionType: c.actionType || 'INVESTIGATE',
            tone: c.tone || 'cautious',
            requiredItemId: c.requiredItemId || null,
            sequence: c.sequence || idx + 1
          }));
          await StoryChoice.bulkCreate(choiceRecords, { transaction: t });
        }

        const snap = node.snapshot || node.gameStateSnapshot || node.characterSnapshot;
        if (snap) {
          await StorySnapshot.create({
            storyNodeId: clonedNode.id,
            characterState: snap.characterState || snap,
            inventoryState: snap.inventoryState || snap.inventory || [],
            questState: snap.questState || snap.missionLog || {},
            worldState: snap.worldState || snap.worldLedger || {},
            ledgerState: snap.ledgerState || snap.worldLedger || {}
          }, { transaction: t });
        }
      }

      for (const { clonedNode, originalParentId } of nodePairs) {
        if (originalParentId && idMap[originalParentId]) {
          clonedNode.parentNodeId = idMap[originalParentId];
          await clonedNode.save({ transaction: t });
        }
      }

      // 6. Clone WorldFacts with remapped sourceNodeId
      const originalFacts = await WorldFact.findAll({
        where: { sessionId: session.id },
        transaction: t
      });

      if (originalFacts.length > 0) {
        const factRecords = originalFacts.map(f => ({
          sessionId: newSlotSession.id,
          campaignId: f.campaignId,
          subjectType: f.subjectType,
          subjectId: f.subjectId,
          factType: f.factType,
          fact: f.fact,
          importance: f.importance,
          turn: f.turn,
          branchId: f.branchId || 'main',
          sourceNodeId: f.sourceNodeId ? (idMap[f.sourceNodeId] || null) : null,
          metadata: f.metadata || {}
        }));
        await WorldFact.bulkCreate(factRecords, { transaction: t });
      }

      // 7. Map currentSceneId
      if (session.currentSceneId && idMap[session.currentSceneId]) {
        newSlotSession.currentSceneId = idMap[session.currentSceneId];
        await newSlotSession.save({ transaction: t });
      }

      return newSlotSession;
    });
  }

  async loadFromSlot(slotNumber) {
    const slotNum = parseInt(slotNumber, 10);
    if (isNaN(slotNum) || slotNum < 0 || slotNum > 3) {
      const err = new Error('Nomor slot tidak valid (0-3).');
      err.statusCode = 400;
      throw err;
    }

    const slotSess = await GameSession.findOne({
      where: { slotNumber: slotNum },
      include: [Character, Campaign]
    });
    if (!slotSess || !slotSess.Character) {
      const err = new Error('Data simpanan di slot ini kosong.');
      err.statusCode = 404;
      throw err;
    }

    const { activeSession, activeChar, currentNode } = await sequelize.transaction(async (t) => {
      const canonicalInv = ItemRepository.normalizeInventory(slotSess.Character.inventory);
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
        inventory: canonicalInv,
        equippedItems: [...(slotSess.Character.equippedItems || [])],
        statusEffects: [...(slotSess.Character.statusEffects || [])]
      }, { transaction: t });

      const newActiveSession = await GameSession.create({
        campaignId: slotSess.campaignId,
        characterId: charClone.id,
        turnCount: slotSess.turnCount,
        activeBranchId: slotSess.activeBranchId || 'main',
        questState: slotSess.questState || {},
        worldLedger: worldLedgerService.normalizeLedger(slotSess.worldLedger),
        missionLog: slotSess.missionLog ? JSON.parse(JSON.stringify(slotSess.missionLog)) : null,
        combatState: slotSess.combatState ? JSON.parse(JSON.stringify(slotSess.combatState)) : null,
        isGameOver: Boolean(slotSess.isGameOver),
        slotNumber: null
      }, { transaction: t });

      const slotNodes = await StoryNode.findAll({
        where: { sessionId: slotSess.id },
        order: [['createdAt', 'ASC']],
        include: [
          { model: StoryChoice, as: 'choiceList' },
          { model: StorySnapshot, as: 'snapshot' }
        ],
        transaction: t
      });

      const idMap = {};
      const nodePairs = [];

      for (const node of slotNodes) {
        const newNode = await StoryNode.create({
          sessionId: newActiveSession.id,
          parentNodeId: null,
          branchId: node.branchId || 'main',
          status: node.status || 'ACTIVE',
          chapterTitle: node.chapterTitle,
          location: node.location,
          locationId: node.locationId,
          backgroundId: node.backgroundId,
          speaker: node.speaker,
          speakerId: node.speakerId,
          characterId: node.characterId,
          turnNumber: node.turnNumber,
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

        const choices = node.choiceList || node.choices || [];
        if (Array.isArray(choices) && choices.length > 0) {
          const choiceRecords = choices.map((c, idx) => ({
            storyNodeId: newNode.id,
            choiceKey: c.choiceKey || c.id || `c_${idx + 1}`,
            text: c.text,
            actionType: c.actionType || 'INVESTIGATE',
            tone: c.tone || 'cautious',
            requiredItemId: c.requiredItemId || null,
            sequence: c.sequence || idx + 1
          }));
          await StoryChoice.bulkCreate(choiceRecords, { transaction: t });
        }

        const snap = node.snapshot || node.gameStateSnapshot || node.characterSnapshot;
        if (snap) {
          await StorySnapshot.create({
            storyNodeId: newNode.id,
            characterState: snap.characterState || snap,
            inventoryState: snap.inventoryState || snap.inventory || [],
            questState: snap.questState || snap.missionLog || {},
            worldState: snap.worldState || snap.worldLedger || {},
            ledgerState: snap.ledgerState || snap.worldLedger || {}
          }, { transaction: t });
        }
      }

      for (const { newNode, originalParentId } of nodePairs) {
        if (originalParentId && idMap[originalParentId]) {
          newNode.parentNodeId = idMap[originalParentId];
          await newNode.save({ transaction: t });
        }
      }

      const slotFacts = await WorldFact.findAll({
        where: { sessionId: slotSess.id },
        transaction: t
      });

      if (slotFacts.length > 0) {
        const factRecords = slotFacts.map(f => ({
          sessionId: newActiveSession.id,
          campaignId: f.campaignId,
          subjectType: f.subjectType,
          subjectId: f.subjectId,
          factType: f.factType,
          fact: f.fact,
          importance: f.importance,
          turn: f.turn,
          branchId: f.branchId || 'main',
          sourceNodeId: f.sourceNodeId ? (idMap[f.sourceNodeId] || null) : null,
          metadata: f.metadata || {}
        }));
        await WorldFact.bulkCreate(factRecords, { transaction: t });
      }

      if (slotSess.currentSceneId && idMap[slotSess.currentSceneId]) {
        newActiveSession.currentSceneId = idMap[slotSess.currentSceneId];
        await newActiveSession.save({ transaction: t });
      }

      const activeCurrentNode = await StoryNode.findByPk(newActiveSession.currentSceneId, {
        include: [{ model: StoryChoice, as: 'choiceList' }, { model: StorySnapshot, as: 'snapshot' }],
        transaction: t
      });

      return {
        activeSession: newActiveSession,
        activeChar: charClone,
        currentNode: activeCurrentNode
      };
    });

    const hydratedInv = await ItemRepository.hydrateInventory(activeChar.inventory);

    return {
      session: activeSession,
      character: {
        ...activeChar.toJSON(),
        inventory: hydratedInv
      },
      campaign: slotSess.Campaign,
      currentNode
    };
  }

  async exportSessionJson(sessionId) {
    if (!sessionId) {
      const err = new Error('sessionId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      const err = new Error('Sesi tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

    const nodes = await StoryNode.findAll({
      where: { sessionId },
      order: [['createdAt', 'ASC']],
      include: [
        { model: StoryChoice, as: 'choiceList' },
        { model: StorySnapshot, as: 'snapshot' }
      ]
    });

    const worldFacts = await WorldFact.findAll({
      where: { sessionId },
      order: [['turn', 'ASC']]
    });

    return {
      exportVersion: '3.0',
      exportedAt: new Date().toISOString(),
      session,
      character: session.Character,
      campaign: session.Campaign,
      nodes,
      worldFacts
    };
  }

  async importSessionJson(sessionData) {
    if (!sessionData || !sessionData.character || !sessionData.nodes) {
      const err = new Error('Format data JSON tidak valid.');
      err.statusCode = 400;
      throw err;
    }

    return await sequelize.transaction(async (t) => {
      const charData = { ...sessionData.character };
      delete charData.id;
      charData.inventory = ItemRepository.normalizeInventory(charData.inventory);
      const createdChar = await Character.create(charData, { transaction: t });

      const sessData = { ...sessionData.session };
      delete sessData.id;
      sessData.characterId = createdChar.id;
      sessData.activeBranchId = sessData.activeBranchId || 'main';
      sessData.questState = sessData.questState || {};
      sessData.worldLedger = worldLedgerService.normalizeLedger(sessData.worldLedger);
      const createdSession = await GameSession.create(sessData, { transaction: t });

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
        nodeData.branchId = nodeData.branchId || 'main';
        nodeData.status = nodeData.status || 'ACTIVE';

        const newNode = await StoryNode.create(nodeData, { transaction: t });
        idMap[oldId] = newNode.id;
        createdNodes.push({
          newNode,
          oldParentId,
          choices: rawNodeData.choiceList || rawNodeData.choices,
          snapshot: rawNodeData.snapshot || rawNodeData.gameStateSnapshot
        });
      }

      for (const { newNode, oldParentId, choices, snapshot } of createdNodes) {
        if (oldParentId && idMap[oldParentId]) {
          newNode.parentNodeId = idMap[oldParentId];
          await newNode.save({ transaction: t });
        }

        if (Array.isArray(choices) && choices.length > 0) {
          const choiceRecords = choices.map((c, idx) => ({
            storyNodeId: newNode.id,
            choiceKey: c.choiceKey || c.id || `c_${idx + 1}`,
            text: c.text,
            actionType: c.actionType || 'INVESTIGATE',
            tone: c.tone || 'cautious',
            requiredItemId: c.requiredItemId || null,
            sequence: c.sequence || idx + 1
          }));
          await StoryChoice.bulkCreate(choiceRecords, { transaction: t });
        }

        if (snapshot) {
          await StorySnapshot.create({
            storyNodeId: newNode.id,
            characterState: snapshot.characterState || snapshot,
            inventoryState: snapshot.inventoryState || snapshot.inventory || [],
            questState: snapshot.questState || snapshot.missionLog || {},
            worldState: snapshot.worldState || snapshot.worldLedger || {},
            ledgerState: snapshot.ledgerState || snapshot.worldLedger || {}
          }, { transaction: t });
        }
      }

      if (Array.isArray(sessionData.worldFacts)) {
        const factRecords = sessionData.worldFacts.map(f => ({
          sessionId: createdSession.id,
          campaignId: f.campaignId,
          subjectType: f.subjectType,
          subjectId: f.subjectId,
          factType: f.factType,
          fact: f.fact,
          importance: f.importance,
          turn: f.turn,
          branchId: f.branchId || 'main',
          sourceNodeId: f.sourceNodeId ? (idMap[f.sourceNodeId] || null) : null,
          metadata: f.metadata || {}
        }));
        await WorldFact.bulkCreate(factRecords, { transaction: t });
      }

      const currentSceneOldId = sessionData.session?.currentSceneId;
      if (currentSceneOldId && idMap[currentSceneOldId]) {
        createdSession.currentSceneId = idMap[currentSceneOldId];
        await createdSession.save({ transaction: t });
      }

      const activeCurrentNode = await StoryNode.findByPk(createdSession.currentSceneId, {
        include: [{ model: StoryChoice, as: 'choiceList' }, { model: StorySnapshot, as: 'snapshot' }],
        transaction: t
      });

      return {
        session: createdSession,
        character: createdChar,
        currentNode: activeCurrentNode
      };
    });
  }
}

module.exports = new SaveLoadService();
