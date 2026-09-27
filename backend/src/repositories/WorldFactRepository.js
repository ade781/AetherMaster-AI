const { WorldFact, StoryNode } = require('../models');

class WorldFactRepository {
  /**
   * Adds a world fact linked to session, sourceNode, and branch.
   */
  static async addFact({ sessionId, campaignId, subjectType, subjectId, factType, fact, importance, turn, sourceNodeId, branchId = 'main' }, transaction = null) {
    if (!sessionId || !fact) return null;
    const options = transaction ? { transaction } : {};
    try {
      // Check duplicate
      const existing = await WorldFact.findOne({
        where: { sessionId, fact },
        ...options
      });
      if (existing) return existing.toJSON();

      const created = await WorldFact.create({
        sessionId,
        campaignId,
        subjectType: subjectType || 'WORLD_EVENT',
        subjectId,
        factType: factType || 'EVENT',
        fact: fact.trim(),
        importance: importance || 'normal',
        turn: turn || 1,
        sourceNodeId,
        branchId
      }, options);

      return created.toJSON();
    } catch (e) {
      console.error('WorldFactRepository.addFact error:', e.message);
      return null;
    }
  }

  /**
   * Finds all world facts for a session.
   */
  static async findBySession(sessionId, limit = 50) {
    if (!sessionId) return [];
    try {
      const facts = await WorldFact.findAll({
        where: { sessionId },
        order: [['turn', 'DESC'], ['createdAt', 'DESC']],
        limit
      });
      return facts.map(f => f.toJSON());
    } catch (e) {
      return [];
    }
  }

  /**
   * Finds world facts strictly associated with active branch nodes.
   * Excludes facts from abandoned branches for clean Journal and Context.
   */
  static async findActiveBranchFacts(sessionId, activeBranchId = null) {
    if (!sessionId) return [];
    try {
      // Find active nodes first
      const activeNodes = await StoryNode.findAll({
        where: {
          sessionId,
          status: 'ACTIVE'
        },
        attributes: ['id']
      });

      const activeNodeIds = activeNodes.map(n => n.id);
      const { Op } = require('sequelize');

      const whereClause = {
        sessionId,
        [Op.or]: [
          { sourceNodeId: activeNodeIds },
          { sourceNodeId: null }
        ]
      };

      if (activeBranchId) {
        whereClause[Op.and] = [
          {
            [Op.or]: [
              { branchId: activeBranchId },
              { branchId: 'main' }
            ]
          }
        ];
      }

      const facts = await WorldFact.findAll({
        where: whereClause,
        order: [['turn', 'ASC'], ['createdAt', 'ASC']]
      });

      return facts.map(f => f.toJSON());
    } catch (e) {
      // Fallback
      return await this.findBySession(sessionId);
    }
  }
}

module.exports = WorldFactRepository;
