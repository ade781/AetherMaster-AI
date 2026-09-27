const { WorldFact } = require('../models');

class WorldFactRepository {
  static async addFact({ sessionId, campaignId, subjectType, subjectId, factType, fact, importance, turn, sourceNodeId }, transaction = null) {
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
        sourceNodeId
      }, options);

      return created.toJSON();
    } catch (e) {
      console.error('WorldFactRepository.addFact error:', e.message);
      return null;
    }
  }

  static async findBySession(sessionId, limit = 20) {
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
}

module.exports = WorldFactRepository;
