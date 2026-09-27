const { Campaign, Location, NPC, Quest, QuestObjective } = require('../models');

class CampaignRepository {
  static async findById(id) {
    if (!id) return null;
    try {
      const camp = await Campaign.findByPk(id, {
        include: [
          { model: Location },
          { model: NPC },
          {
            model: Quest,
            include: [{ model: QuestObjective, as: 'objectives' }]
          }
        ]
      });
      return camp ? camp.toJSON() : null;
    } catch (e) {
      return null;
    }
  }

  static async findAll() {
    try {
      const campaigns = await Campaign.findAll({
        where: { status: 'published' }
      });
      return campaigns.map(c => c.toJSON());
    } catch (e) {
      return [];
    }
  }
}

module.exports = CampaignRepository;
