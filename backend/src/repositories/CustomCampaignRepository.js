const { CustomCampaign } = require('../models');

class CustomCampaignRepository {
  async createCampaign(data, options = {}) {
    return await CustomCampaign.create(data, options);
  }

  async findAll(options = {}) {
    return await CustomCampaign.findAll({
      order: [['createdAt', 'DESC']],
      ...options
    });
  }

  async findById(id, options = {}) {
    return await CustomCampaign.findByPk(id, options);
  }

  async deleteById(id, options = {}) {
    return await CustomCampaign.destroy({
      where: { id },
      ...options
    });
  }
}

module.exports = new CustomCampaignRepository();
