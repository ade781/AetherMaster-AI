const { Location, NPC } = require('../models');

class LocationRepository {
  static async findById(id) {
    if (!id) return null;
    try {
      const loc = await Location.findByPk(id, { include: [NPC] });
      return loc ? loc.toJSON() : null;
    } catch (e) {
      return null;
    }
  }

  static async findByCampaign(campaignId) {
    try {
      const locations = await Location.findAll({
        where: { campaignId },
        include: [NPC]
      });
      return locations.map(l => l.toJSON());
    } catch (e) {
      return [];
    }
  }

  static async findByBackgroundId(backgroundId) {
    try {
      const loc = await Location.findOne({
        where: { backgroundId },
        include: [NPC]
      });
      return loc ? loc.toJSON() : null;
    } catch (e) {
      return null;
    }
  }

  static async findAll() {
    try {
      const locs = await Location.findAll();
      return locs.map(l => l.toJSON());
    } catch (e) {
      return [];
    }
  }
}

module.exports = LocationRepository;
