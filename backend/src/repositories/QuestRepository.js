const { Quest, QuestObjective } = require('../models');

class QuestRepository {
  static async findByCampaign(campaignId) {
    try {
      const quests = await Quest.findAll({
        where: { campaignId },
        include: [{ model: QuestObjective, as: 'objectives' }],
        order: [['priority', 'ASC'], [{ model: QuestObjective, as: 'objectives' }, 'sequence', 'ASC']]
      });
      return quests.map(q => q.toJSON());
    } catch (e) {
      return [];
    }
  }

  static async findById(id) {
    if (!id) return null;
    try {
      const quest = await Quest.findByPk(id, {
        include: [{ model: QuestObjective, as: 'objectives' }]
      });
      return quest ? quest.toJSON() : null;
    } catch (e) {
      return null;
    }
  }
}

module.exports = QuestRepository;
