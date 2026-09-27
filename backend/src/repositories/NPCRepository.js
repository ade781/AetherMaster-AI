const { NPC, Location } = require('../models');

class NPCRepository {
  static async findById(id) {
    if (!id) return null;
    try {
      const npc = await NPC.findByPk(id, { include: [Location] });
      return npc ? npc.toJSON() : null;
    } catch (e) {
      return null;
    }
  }

  static async findByCampaign(campaignId) {
    try {
      const npcs = await NPC.findAll({
        where: { campaignId },
        include: [Location]
      });
      return npcs.map(n => n.toJSON());
    } catch (e) {
      return [];
    }
  }

  static async findNearby(locationId) {
    try {
      const npcs = await NPC.findAll({
        where: { defaultLocationId: locationId }
      });
      return npcs.map(n => n.toJSON());
    } catch (e) {
      return [];
    }
  }

  static async findAll() {
    try {
      const npcs = await NPC.findAll({ include: [Location] });
      return npcs.map(n => n.toJSON());
    } catch (e) {
      return [];
    }
  }
}

module.exports = NPCRepository;
