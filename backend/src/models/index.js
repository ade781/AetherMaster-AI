const { sequelize } = require('../config/database');
const Campaign = require('./Campaign');
const StoryScene = require('./StoryScene');
const StorySession = require('./StorySession');

// Associations
Campaign.hasMany(StoryScene, { foreignKey: 'campaignId', onDelete: 'CASCADE' });
StoryScene.belongsTo(Campaign, { foreignKey: 'campaignId' });

StoryScene.belongsTo(StoryScene, { as: 'parent', foreignKey: 'parentId' });
StoryScene.hasMany(StoryScene, { as: 'children', foreignKey: 'parentId' });

// Default Preset Campaigns
const defaultCampaigns = [
  {
    id: 'whispering_tavern',
    title: 'The Whispering Tavern & The Cursed Woods',
    premise: 'Malam badai di kedai tua di tepi Hutan Terkutuk. Seorang buronan bertopeng menawarkan gulungan kontrak berlumur segel darah menuju relik kuno.',
    genre: 'dark_fantasy',
    icon: '🌲',
    isCustom: false,
  },
  {
    id: 'sunken_citadel',
    title: 'The Sunken Citadel of the Deep',
    premise: 'Ekspedisi bawah air ke kota reruntuhan kuno yang tenggelam ribuan tahun lalu, di mana bisikan entitas gurita kosmik menanti para penyelam berani.',
    genre: 'eldritch_mystery',
    icon: '🐙',
    isCustom: false,
  },
  {
    id: 'crypt_necromancer',
    title: 'The Crypt of the Crimson Necromancer',
    premise: 'Menyusup ke dalam katakombe bawah tanah berbau belerang untuk menghentikan ritual kebangkitan pasukan mayat hidup sang Penyihir Darah.',
    genre: 'gothic_horror',
    icon: '💀',
    isCustom: false,
  },
];

const initModels = async () => {
  await sequelize.sync({ alter: true });

  // Seed default campaigns if table is empty
  const count = await Campaign.count();
  if (count === 0) {
    await Campaign.bulkCreate(defaultCampaigns);
    console.log('🌱 [Sequelize] Default campaigns seeded successfully.');
  }
};

module.exports = {
  sequelize,
  Campaign,
  StoryScene,
  StorySession,
  initModels,
};
