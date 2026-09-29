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

class SaveFileService {
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
          await StoryChoice.bulkCreate(choiceRecords, { transaction: t });
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

module.exports = new SaveFileService();
