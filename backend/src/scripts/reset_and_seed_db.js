const fs = require('fs');
const path = require('path');
const { sequelize, initDb, Campaign } = require('../models');

async function resetAndSeed() {
  console.log('=== [AetherMaster AI] Reset & Seed Database ===');


  // 2. Force sync sequelize to rebuild schema
  console.log(`Rebuilding tables (${sequelize.getDialect()})...`);
  await sequelize.sync({ force: true });
  console.log('✓ Tables synced with force: true');

  // 3. Seed campaigns
  const { seedCampaigns } = require('../models/seeders/campaignSeeder');
  await seedCampaigns();

  const count = await Campaign.count();
  console.log(`Database successfully overhauled with ${count} campaigns seeded.`);
  process.exit(0);
}

resetAndSeed().catch(err => {
  console.error('Reset and seed failed:', err);
  process.exit(1);
});
