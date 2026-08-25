const { Campaign } = require('../models');

// @desc    Get all campaigns
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({ order: [['updatedAt', 'DESC']] });
    return res.json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil modul campaign', error: error.message });
  }
};

// @desc    Get single campaign by ID
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign tidak ditemukan' });
    return res.json({ success: true, data: campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail campaign', error: error.message });
  }
};

// @desc    Create new Campaign
exports.createCampaign = async (req, res) => {
  try {
    const { title, synopsis, genre, difficulty, coverImage, questNodes, lorebook, customMonsters, mapLayout } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Judul Campaign wajib diisi' });
    }

    const campaign = await Campaign.create({
      title,
      synopsis,
      genre: genre || 'Dark Fantasy',
      difficulty: difficulty || 'Menengah (Tingkat 1-4)',
      coverImage,
      questNodes: questNodes || [],
      lorebook: lorebook || [],
      customMonsters: customMonsters || [],
      mapLayout: mapLayout || [],
    });

    return res.status(201).json({ success: true, message: 'Campaign berhasil diciptakan!', data: campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal membuat campaign', error: error.message });
  }
};

// @desc    Update Campaign
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign tidak ditemukan' });

    await campaign.update(req.body);
    return res.json({ success: true, message: 'Campaign berhasil diperbarui', data: campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui campaign', error: error.message });
  }
};

// @desc    Delete Campaign
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign tidak ditemukan' });

    await campaign.destroy();
    return res.json({ success: true, message: 'Campaign berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus campaign', error: error.message });
  }
};
