const { sequelize } = require('../config/database');
const Character = require('./Character');
const Campaign = require('./Campaign');
const Location = require('./Location');
const NPC = require('./NPC');
const Item = require('./Item');
const Quest = require('./Quest');
const WorldFact = require('./WorldFact');
const GameSession = require('./GameSession');
const StoryNode = require('./StoryNode');
const StoryChoice = require('./StoryChoice');
const StorySnapshot = require('./StorySnapshot');

const { seedCampaigns } = require('./seeders/campaignSeeder');
const { seedWorldData } = require('./seeders/worldDataSeeder');

// --- RELATIONSHIPS ---

// Character <-> GameSession
Character.hasMany(GameSession, { foreignKey: 'characterId', onDelete: 'CASCADE' });
GameSession.belongsTo(Character, { foreignKey: 'characterId' });

// Campaign <-> GameSession
Campaign.hasMany(GameSession, { foreignKey: 'campaignId', onDelete: 'CASCADE' });
GameSession.belongsTo(Campaign, { foreignKey: 'campaignId' });

// Campaign <-> Location
Campaign.hasMany(Location, { foreignKey: 'campaignId', onDelete: 'CASCADE' });
Location.belongsTo(Campaign, { foreignKey: 'campaignId' });

// Location self-relation (sub-locations / areas)
Location.hasMany(Location, { as: 'subLocations', foreignKey: 'parentLocationId' });
Location.belongsTo(Location, { as: 'parentLocation', foreignKey: 'parentLocationId' });

// Campaign <-> NPC
Campaign.hasMany(NPC, { foreignKey: 'campaignId', onDelete: 'CASCADE' });
NPC.belongsTo(Campaign, { foreignKey: 'campaignId' });

// Location <-> NPC (Stationed location)
Location.hasMany(NPC, { foreignKey: 'defaultLocationId' });
NPC.belongsTo(Location, { foreignKey: 'defaultLocationId' });

// Campaign <-> Quest
Campaign.hasMany(Quest, { foreignKey: 'campaignId', onDelete: 'CASCADE' });
Quest.belongsTo(Campaign, { foreignKey: 'campaignId' });


// GameSession <-> StoryNode
GameSession.hasMany(StoryNode, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
StoryNode.belongsTo(GameSession, { foreignKey: 'sessionId' });

// StoryNode self-relation (story tree hierarchy)
StoryNode.hasMany(StoryNode, { as: 'children', foreignKey: 'parentNodeId' });
StoryNode.belongsTo(StoryNode, { as: 'parent', foreignKey: 'parentNodeId' });

// StoryNode <-> StoryChoice
StoryNode.hasMany(StoryChoice, { foreignKey: 'storyNodeId', as: 'choiceList', onDelete: 'CASCADE' });
StoryChoice.belongsTo(StoryNode, { foreignKey: 'storyNodeId' });

// StoryNode <-> StorySnapshot
StoryNode.hasOne(StorySnapshot, { foreignKey: 'storyNodeId', as: 'snapshot', onDelete: 'CASCADE' });
StorySnapshot.belongsTo(StoryNode, { foreignKey: 'storyNodeId' });

// GameSession <-> WorldFact
GameSession.hasMany(WorldFact, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
WorldFact.belongsTo(GameSession, { foreignKey: 'sessionId' });

// Location / NPC <-> StoryNode references
Location.hasMany(StoryNode, { foreignKey: 'locationId' });
StoryNode.belongsTo(Location, { foreignKey: 'locationId' });

NPC.hasMany(StoryNode, { foreignKey: 'speakerId' });
StoryNode.belongsTo(NPC, { foreignKey: 'speakerId' });

const initDb = async (options = {}) => {
  await sequelize.authenticate();
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    // In production, avoid destructive automatic schema alterations
    await sequelize.sync({ alter: false, ...options });
    // Optimize serverless cold starts: only seed if table is completely unseeded
    const campaignCount = await Campaign.count().catch(() => 0);
    if (campaignCount === 0) {
      await seedCampaigns();
      await seedWorldData();
    }
  } else {
    // In development (MySQL / Postgres), sync with alter: true to automatically sync missing columns
    const dialect = sequelize.getDialect();
    const shouldAlter = dialect === 'mysql' || dialect === 'postgres';
    await sequelize.sync({ alter: shouldAlter, ...options });
    await seedCampaigns();
    await seedWorldData();
  }
};

module.exports = {
  sequelize,
  Character,
  Campaign,
  Location,
  NPC,
  Item,
  Quest,
  WorldFact,
  GameSession,
  StoryNode,
  StoryChoice,
  StorySnapshot,
  initDb,
  seedCampaigns,
  seedWorldData
};
