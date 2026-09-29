const {
  sequelize,
  Character,
  Campaign,
  GameSession,
  StoryNode,
  StoryChoice,
  StorySnapshot,
  WorldFact
} = require('../../models');
const { worldLedgerService } = require('../../engine');
const { ItemRepository } = require('../../repositories');
const graphCloneService = require('./graphCloneService');

class SlotService {
  /**
   * Retrieves canonical representation of all 4 save slots (0: Auto, 1-3: Manual).
   * Follows strict API Contract: hp, maxHp, characterLevel, location, etc.
   */
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
        campaignTitle: sess.Campaign?.title,
        characterName: sess.Character?.name,
        characterClass: sess.Character?.characterClass,
        characterLevel: sess.Character?.level || 1,
        hp: sess.Character?.hp,
        maxHp: sess.Character?.maxHp,
        mana: sess.Character?.mana,
        maxMana: sess.Character?.maxMana,
        gold: sess.Character?.gold,
        location: node?.location,
        backgroundId: node?.backgroundId,
        turnCount: sess.turnCount,
        activeBranchId: sess.activeBranchId || 'main'
      };
    }

    return slots;
  }

  /**
   * Saves active session into specified slot (0 for auto, 1-3 for manual).
   */
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
      const err = new Error('Sesi atau data karakter tidak ditemukan.');
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

      // 3. Create frozen slot session
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

      // 4. Clone graph via graphCloneService
      await graphCloneService.cloneStoryGraph({
        sourceSessionId: session.id,
        targetSession: newSlotSession,
        sourceCurrentSceneId: session.currentSceneId,
        transaction: t
      });

      return newSlotSession;
    });
  }

  /**
   * Loads state from save slot into a fresh active session.
   */
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

      // Clone graph via graphCloneService
      await graphCloneService.cloneStoryGraph({
        sourceSessionId: slotSess.id,
        targetSession: newActiveSession,
        sourceCurrentSceneId: slotSess.currentSceneId,
        transaction: t
      });

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
}

module.exports = new SlotService();
