const { initDb, sequelize, Character, Campaign, GameSession, StoryNode } = require('../backend/src/models');

async function runModelTests() {
  console.log('=== [PHASE 1.1] Testing SQLite Database & Sequelize Models ===');
  await initDb();

  // Test 1: Campaigns exist and have seeded data
  const campaigns = await Campaign.findAll();
  if (campaigns.length < 3) {
    throw new Error(`Expected at least 3 campaigns seeded, found ${campaigns.length}`);
  }
  console.log(`✓ Campaigns Seed Check: Found ${campaigns.length} campaigns (OK)`);

  // Test 2: Create Character
  const testChar = await Character.create({
    name: 'Sir Galahad Test',
    race: 'human',
    characterClass: 'warrior',
    level: 1,
    hp: 35,
    maxHp: 35,
    mana: 15,
    maxMana: 15,
    gold: 50,
    str: 16,
    dex: 12,
    con: 15,
    int: 10,
    wis: 12,
    cha: 14,
    avatarUrl: 'char_hero_01_paladin',
    inventory: [
      { id: 'item_01_potion_heal', name: 'Potion of Healing', category: 'Obat', effect: 'Pulihkan 25 HP', icon: 'item_01_potion_heal' }
    ],
    statusEffects: []
  });
  if (!testChar.id) throw new Error('Character creation failed (no ID)');
  console.log(`✓ Character Model Check: Created character ${testChar.name} with ID ${testChar.id} (OK)`);

  // Test 3: Create GameSession with relations
  const testSession = await GameSession.create({
    campaignId: campaigns[0].id,
    characterId: testChar.id,
    turnCount: 1,
    worldLedger: { questFlags: { test_flag: true }, reputation: { guild: 10 } },
    isGameOver: false
  });
  if (!testSession.id) throw new Error('GameSession creation failed');
  console.log(`✓ GameSession Model Check: Created session ${testSession.id} linked to character & campaign (OK)`);

  // Test 4: Create StoryNodes (parent & child)
  const rootNode = await StoryNode.create({
    sessionId: testSession.id,
    parentNodeId: null,
    chapterTitle: 'Babak Pengujian I',
    location: 'Ruang Uji Coba Aether',
    backgroundId: 'bg_01_tavern',
    speaker: 'Dungeon Master',
    characterId: 'char_hero_01_paladin',
    mood: 'mysterious',
    dialogueText: 'Selamat datang di panggung pengujian model database.',
    consequenceNote: 'Pengujian awal berhasil.',
    choices: [
      { id: 'c1', text: 'Melangkah ke portal pengujian', statType: 'INT', dc: 10 }
    ]
  });

  const childNode = await StoryNode.create({
    sessionId: testSession.id,
    parentNodeId: rootNode.id,
    chapterTitle: 'Babak Pengujian II',
    location: 'Portal Pengujian',
    backgroundId: 'bg_08_arcane_library',
    speaker: 'Penjaga Portal',
    characterId: 'char_hero_03_wizard',
    mood: 'tense',
    dialogueText: 'Portal terbuka lebar menyambut petualang cerdas.',
    consequenceNote: 'Lolos uji kecerdasan INT.',
    choices: []
  });

  testSession.currentSceneId = childNode.id;
  await testSession.save();

  // Verify child node has correct parent relation
  const fetchedChild = await StoryNode.findByPk(childNode.id);
  if (fetchedChild.parentNodeId !== rootNode.id) {
    throw new Error('Parent-child StoryNode relation mismatch');
  }
  console.log(`✓ StoryNode Hierarchy Check: Parent -> Child node relation verified (OK)`);

  // Cleanup test data
  await StoryNode.destroy({ where: { sessionId: testSession.id } });
  await GameSession.destroy({ where: { id: testSession.id } });
  await Character.destroy({ where: { id: testChar.id } });
  console.log(`✓ Database Cleanup: Temporary test entities removed cleanly (OK)`);

  console.log('✓ [PHASE 1.1 PASSED] All Database & Model tests succeeded!\n');
}

module.exports = { runModelTests };
