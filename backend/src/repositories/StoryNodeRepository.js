const { StoryNode, StoryChoice, StorySnapshot } = require('../models');

class StoryNodeRepository {
  static async createNode(nodeData, choices = [], snapshotData = null, transaction = null) {
    const opts = transaction ? { transaction } : {};
    const createdNode = await StoryNode.create(nodeData, opts);

    if (Array.isArray(choices) && choices.length > 0) {
      for (let i = 0; i < choices.length; i++) {
        const c = choices[i];
        await StoryChoice.create({
          storyNodeId: createdNode.id,
          choiceKey: c.id || `choice_${i + 1}`,
          text: c.text,
          actionType: c.actionType || 'INVESTIGATE',
          tone: c.tone || 'cautious',
          requiredItemId: c.requiredItemId || null,
          sequence: i + 1
        }, opts);
      }
    }

    if (snapshotData) {
      await StorySnapshot.create({
        storyNodeId: createdNode.id,
        characterState: snapshotData.characterState || snapshotData,
        inventoryState: snapshotData.inventoryState || snapshotData.inventory || [],
        questState: snapshotData.questState || snapshotData.missionLog || {},
        worldState: snapshotData.worldState || snapshotData.worldLedger || {},
        ledgerState: snapshotData.ledgerState || snapshotData.worldLedger || {}
      }, opts);
    }

    return createdNode;
  }

  static async findById(id) {
    if (!id) return null;
    return await StoryNode.findByPk(id, {
      include: [
        { model: StoryChoice, as: 'choiceList' },
        { model: StorySnapshot, as: 'snapshot' }
      ]
    });
  }

  static async findTimeline(sessionId) {
    if (!sessionId) return [];
    return await StoryNode.findAll({
      where: { sessionId },
      order: [['createdAt', 'ASC']],
      include: [{ model: StoryChoice, as: 'choiceList' }]
    });
  }
}

module.exports = StoryNodeRepository;
