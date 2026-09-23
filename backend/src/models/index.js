const { sequelize } = require('../config/database');
const Character = require('./Character');
const Campaign = require('./Campaign');
const GameSession = require('./GameSession');
const StoryNode = require('./StoryNode');

// Relations
Character.hasMany(GameSession, { foreignKey: 'characterId', onDelete: 'CASCADE' });
GameSession.belongsTo(Character, { foreignKey: 'characterId' });

Campaign.hasMany(GameSession, { foreignKey: 'campaignId', onDelete: 'CASCADE' });
GameSession.belongsTo(Campaign, { foreignKey: 'campaignId' });

GameSession.hasMany(StoryNode, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
StoryNode.belongsTo(GameSession, { foreignKey: 'sessionId' });

StoryNode.hasMany(StoryNode, { as: 'children', foreignKey: 'parentNodeId' });
StoryNode.belongsTo(StoryNode, { as: 'parent', foreignKey: 'parentNodeId' });

// Seed campaigns if empty
const seedCampaigns = async () => {
  const count = await Campaign.count();
  if (count === 0) {
    await Campaign.bulkCreate([
      {
        id: 'whispering_tavern',
        title: 'Misteri Kedai Whispering Tavern',
        premise: 'Sebuah desas-desus kelam menyebar dari ruang bawah tanah kedai tua. Makam kuno yang tertidur kini bangkit kembali.',
        genre: 'dark_fantasy',
        icon: '🍺',
        defaultBackgroundId: 'bg_01_tavern'
      },
      {
        id: 'crypt_of_crimson',
        title: 'Makam Merah Darah & Teror Bayangan',
        premise: 'Kultus kuno membangkitkan Necromancer Malakor dari tidurnya. Harta karun legendaris menanti petualang pemberani.',
        genre: 'gothic_horror',
        icon: '💀',
        defaultBackgroundId: 'bg_04_crimson_crypt'
      },
      {
        id: 'abyssal_citadel',
        title: 'Reruntuhan Samudra Sunken Citadel',
        premise: 'Kuil kuno di dasar samudra memanggil arwah pelaut. Penjaga gurita raksasa dan monster laut menjaga relik aether.',
        genre: 'eldritch_mystery',
        icon: '🌊',
        defaultBackgroundId: 'bg_03_sunken_citadel'
      }
    ]);
  }
};

const initDb = async () => {
  await sequelize.sync({ alter: true });
  await seedCampaigns();
};

module.exports = {
  sequelize,
  Character,
  Campaign,
  GameSession,
  StoryNode,
  initDb
};
