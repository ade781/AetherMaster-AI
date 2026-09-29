const { z } = require('zod');
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

const importSchema = z.object({
  character: z.object({
    name: z.string().min(1).default('Petualang Aether'),
    characterClass: z.string().default('warrior'),
    race: z.string().default('human'),
    level: z.number().int().min(1).default(1),
    hp: z.number().int().default(30),
    maxHp: z.number().int().min(1).default(30),
    mana: z.number().int().default(20),
    maxMana: z.number().int().min(0).default(20),
    gold: z.number().int().min(0).default(0),
    inventory: z.array(z.any()).default([]),
    equippedItems: z.array(z.any()).default([]),
    statusEffects: z.array(z.any()).default([])
  }),
  session: z.object({
    campaignId: z.string().min(1).default('whispering_tavern'),
    turnCount: z.number().int().min(1).default(1),
    activeBranchId: z.string().default('main'),
    currentSceneId: z.string().nullable().optional(),
    questState: z.record(z.string(), z.any()).optional(),
    missionLog: z.record(z.string(), z.any()).nullable().optional(),
    worldLedger: z.record(z.string(), z.any()).optional(),
    isGameOver: z.boolean().default(false)
  }),
  nodes: z.array(z.object({
    id: z.string(),
    chapterTitle: z.string().optional(),
    location: z.string().optional(),
    speaker: z.string().optional(),
    dialogueText: z.string().optional(),
    choices: z.array(z.any()).optional(),
    parentNodeId: z.string().nullable().optional(),
    branchId: z.string().optional(),
    status: z.string().optional()
  })).min(1, 'Simpanan harus memiliki minimal 1 adegan cerita.'),
  worldFacts: z.array(z.any()).optional()
});

class SaveFileService {
  async exportSessionJson(sessionId) {
    if (!sessionId) {
      const err = new Error('sessionId wajib disertakan.');
      err.statusCode = 400;
      err.code = 'VALIDATION_FAILED';
      throw err;
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      const err = new Error('Sesi tidak ditemukan.');
      err.statusCode = 404;
      err.code = 'SESSION_NOT_FOUND';
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
    if (!sessionData || typeof sessionData !== 'object') {
      const err = new Error('Format data JSON tidak valid.');
      err.statusCode = 400;
      err.code = 'INVALID_SAVE_FILE';
      throw err;
    }

    // Validate schema with Zod
    const validation = importSchema.safeParse(sessionData);
    if (!validation.success) {
      const issues = validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      const err = new Error(`Data simpanan tidak valid: ${issues}`);
      err.statusCode = 400;
      err.code = 'INVALID_SAVE_FILE';
      throw err;
    }

    const validated = validation.data;

    return await sequelize.transaction(async (t) => {
      // 1. Sanitize & clamp character data
      const charData = { ...validated.character };
      delete charData.id;
      charData.hp = Math.min(charData.maxHp, Math.max(0, charData.hp));
      charData.mana = Math.min(charData.maxMana, Math.max(0, charData.mana));
      charData.gold = Math.max(0, charData.gold);
      charData.inventory = ItemRepository.normalizeInventory(charData.inventory);

      const createdChar = await Character.create(charData, { transaction: t });

      // 2. Create session with sanitized fields
      const sessData = { ...validated.session };
      delete sessData.id;
      sessData.characterId = createdChar.id;
      sessData.activeBranchId = sessData.activeBranchId || 'main';
      sessData.questState = sessData.questState || {};
      sessData.worldLedger = worldLedgerService.normalizeLedger(sessData.worldLedger);

      const createdSession = await GameSession.create(sessData, { transaction: t });

      const idMap = {};
      const createdNodes = [];

      for (const rawNodeData of validated.nodes) {
        const nodePayload = { ...rawNodeData };
        delete nodePayload.id;
        delete nodePayload.choiceList;
        delete nodePayload.snapshot;
        nodePayload.sessionId = createdSession.id;
        nodePayload.parentNodeId = null;

        const newNode = await StoryNode.create(nodePayload, { transaction: t });
        idMap[rawNodeData.id] = newNode.id;
        createdNodes.push({ newNode, originalParentId: rawNodeData.parentNodeId });

        const choices = rawNodeData.choiceList || rawNodeData.choices || [];
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
          await StoryChoice.bulkCreate(choiceRecords, { transaction });
        }

        const snapshot = rawNodeData.snapshot || rawNodeData.gameStateSnapshot || rawNodeData.characterSnapshot;
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

      for (const { newNode, originalParentId } of createdNodes) {
        if (originalParentId && idMap[originalParentId]) {
          newNode.parentNodeId = idMap[originalParentId];
          await newNode.save({ transaction: t });
        }
      }

      if (Array.isArray(validated.worldFacts)) {
        const factRecords = validated.worldFacts.map(f => ({
          sessionId: createdSession.id,
          campaignId: f.campaignId || createdSession.campaignId,
          subjectType: f.subjectType || 'WORLD_EVENT',
          subjectId: f.subjectId || 'location',
          factType: f.factType || 'DISCOVERY',
          fact: f.fact || '',
          importance: f.importance || 1,
          turn: f.turn || 1,
          branchId: f.branchId || 'main',
          sourceNodeId: f.sourceNodeId ? (idMap[f.sourceNodeId] || null) : null,
          metadata: f.metadata || {}
        }));
        await WorldFact.bulkCreate(factRecords, { transaction: t });
      }

      const currentSceneOldId = validated.session?.currentSceneId;
      if (currentSceneOldId && idMap[currentSceneOldId]) {
        createdSession.currentSceneId = idMap[currentSceneOldId];
        await createdSession.save({ transaction: t });
      } else if (createdNodes.length > 0) {
        createdSession.currentSceneId = createdNodes[createdNodes.length - 1].newNode.id;
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

module.exports = new SaveFileService();
