const { StoryNode, StoryChoice, StorySnapshot } = require('../models');

class StoryNodeRepository {
  /**
   * Creates a story node along with its official StoryChoice and StorySnapshot records.
   */
  static async createNode(nodeData, choices = [], snapshotData = null, transaction = null) {
    const opts = transaction ? { transaction } : {};
    const createdNode = await StoryNode.create({
      ...nodeData,
      branchId: nodeData.branchId || 'main',
      status: nodeData.status || 'ACTIVE'
    }, opts);

    if (Array.isArray(choices) && choices.length > 0) {
      const choiceRecords = choices.map((c, idx) => ({
        storyNodeId: createdNode.id,
        choiceKey: c.id || c.choiceKey || `choice_${idx + 1}`,
        text: c.text,
        actionType: c.actionType || c.type || 'INVESTIGATE',
        tone: c.tone || 'cautious',
        requiredItemId: c.requiredItemId || null,
        sequence: c.sequence || idx + 1
      }));
      await StoryChoice.bulkCreate(choiceRecords, opts);
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

  /**
   * Finds a story node by ID including its choices and snapshot.
   */
  static async findById(id) {
    if (!id) return null;
    return await StoryNode.findByPk(id, {
      include: [
        { model: StoryChoice, as: 'choiceList' },
        { model: StorySnapshot, as: 'snapshot' }
      ]
    });
  }

  /**
   * Retrieves all nodes belonging to the active branch/path.
   */
  static async findActiveTimeline(sessionId, branchId = null) {
    if (!sessionId) return [];
    const where = {
      sessionId,
      status: 'ACTIVE'
    };
    if (branchId) {
      where.branchId = branchId;
    }

    return await StoryNode.findAll({
      where,
      order: [['createdAt', 'ASC']],
      include: [
        { model: StoryChoice, as: 'choiceList' },
        { model: StorySnapshot, as: 'snapshot' }
      ]
    });
  }

  /**
   * Marks descendants of a rewind point as ABANDONED (Approach B branching).
   */
  static async abandonFutureNodes(sessionId, targetNode, transaction = null) {
    if (!sessionId || !targetNode) return 0;
    const opts = transaction ? { transaction } : {};
    const { Op } = require('sequelize');

    // Any active node created after targetNode in this session on the target branch is marked ABANDONED
    const [affectedCount] = await StoryNode.update(
      { status: 'ABANDONED' },
      {
        where: {
          sessionId,
          status: 'ACTIVE',
          createdAt: {
            [Op.gt]: targetNode.createdAt
          }
        },
        ...opts
      }
    );

    return affectedCount;
  }

  /**
   * Finds entire story tree for a session (including ACTIVE and ABANDONED branches).
   */
  static async findStoryTree(sessionId) {
    if (!sessionId) return [];
    return await StoryNode.findAll({
      where: { sessionId },
      order: [['createdAt', 'ASC']],
      include: [
        { model: StoryChoice, as: 'choiceList' },
        { model: StorySnapshot, as: 'snapshot' }
      ]
    });
  }
}

module.exports = StoryNodeRepository;
