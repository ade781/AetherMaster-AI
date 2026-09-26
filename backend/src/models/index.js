const { sequelize } = require('../config/database');
const Character = require('./Character');
const Campaign = require('./Campaign');
const GameSession = require('./GameSession');
const StoryNode = require('./StoryNode');
const { seedCampaigns } = require('./seeders/campaignSeeder');

// Relations
Character.hasMany(GameSession, { foreignKey: 'characterId', onDelete: 'CASCADE' });
GameSession.belongsTo(Character, { foreignKey: 'characterId' });

Campaign.hasMany(GameSession, { foreignKey: 'campaignId', onDelete: 'CASCADE' });
GameSession.belongsTo(Campaign, { foreignKey: 'campaignId' });

GameSession.hasMany(StoryNode, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
StoryNode.belongsTo(GameSession, { foreignKey: 'sessionId' });

StoryNode.hasMany(StoryNode, { as: 'children', foreignKey: 'parentNodeId' });
StoryNode.belongsTo(StoryNode, { as: 'parent', foreignKey: 'parentNodeId' });

const initDb = async (options = {}) => {
  await sequelize.sync({ alter: true, ...options });
  await seedCampaigns();
};

module.exports = {
  sequelize,
  Character,
  Campaign,
  GameSession,
  StoryNode,
  initDb,
  seedCampaigns
};
