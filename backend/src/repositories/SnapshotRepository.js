const { StorySnapshot } = require('../models');

class SnapshotRepository {
  static async createSnapshot(storyNodeId, snapshotData, transaction = null) {
    const opts = transaction ? { transaction } : {};
    return await StorySnapshot.create({
      storyNodeId,
      characterState: snapshotData.characterState || snapshotData,
      inventoryState: snapshotData.inventoryState || snapshotData.inventory || [],
      questState: snapshotData.questState || snapshotData.missionLog || {},
      worldState: snapshotData.worldState || snapshotData.worldLedger || {},
      ledgerState: snapshotData.ledgerState || snapshotData.worldLedger || {}
    }, opts);
  }

  static async findByStoryNodeId(storyNodeId) {
    if (!storyNodeId) return null;
    return await StorySnapshot.findOne({
      where: { storyNodeId }
    });
  }
}

module.exports = SnapshotRepository;
