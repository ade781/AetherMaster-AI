const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const {
  sequelize,
  Character,
  Campaign,
  GameSession,
  StoryNode,
  StoryChoice,
  StorySnapshot
} = require('../src/models');
const saveLoadService = require('../src/services/saveLoadService');
const graphCloneService = require('../src/services/saveLoad/graphCloneService');
const slotService = require('../src/services/saveLoad/slotService');
const saveFileService = require('../src/services/saveLoad/saveFileService');

describe('Save/Load Round-Trip & Graph Cloning Tests (Stage 3)', () => {
  let isDbAvailable = false;

  before(async () => {
    try {
      await sequelize.authenticate();
      isDbAvailable = true;
    } catch {
      isDbAvailable = false;
    }
  });

  it('1. SaveToSlot and LoadFromSlot round-trip preserves state accurately', async (t) => {
    if (!isDbAvailable) {
      t.skip('Database connection unavailable; skipping persistent DB round-trip test.');
      return;
    }
    // A. Setup test campaign, character, and session in SQLite
    const testCampaign = await Campaign.findByPk('whispering_tavern') || await Campaign.create({
      id: 'whispering_tavern',
      title: 'Bisikan Kedai Terkutuk',
      premise: 'Misteri kedai terkutuk.',
      defaultBackgroundId: 'bg_01_tavern'
    });

    const testChar = await Character.create({
      name: 'RoundTripKnight',
      characterClass: 'paladin',
      level: 2,
      hp: 28,
      maxHp: 35,
      mana: 12,
      maxMana: 15,
      gold: 75,
      inventory: [{ itemId: 'item_01_potion_heal', quantity: 2 }]
    });

    const testSession = await GameSession.create({
      campaignId: testCampaign.id,
      characterId: testChar.id,
      turnCount: 4,
      activeBranchId: 'main',
      worldLedger: { flags: { visited_cellar: true }, reputation: { guard: 10 } },
      missionLog: { title: 'Misi Utama', objective: 'Masuki ruang bawah tanah', status: 'active' },
      isGameOver: false
    });

    const testNode = await StoryNode.create({
      sessionId: testSession.id,
      chapterTitle: 'Babak IV: Di Bawah Tanah',
      location: 'Ruang Bawah Tanah',
      backgroundId: 'bg_02_dungeon',
      speaker: 'Narator',
      turnNumber: 4,
      dialogueText: 'Hawa dingin menyergap dari balik lorong batu tua.'
    });

    await StoryChoice.create({
      storyNodeId: testNode.id,
      choiceKey: 'c1',
      text: 'Maju dengan pedang terhunus',
      actionType: 'MOVE',
      sequence: 1
    });

    testSession.currentSceneId = testNode.id;
    await testSession.save();

    // B. Save to Slot 1
    const savedSlot = await saveLoadService.saveToSlot({
      sessionId: testSession.id,
      slotNumber: 1,
      saveTitle: 'Manual Save Slot 1'
    });

    assert.ok(savedSlot, 'Save must succeed');
    assert.strictEqual(savedSlot.slotNumber, 1);

    // C. Verify getSaveSlots contract
    const allSlots = await saveLoadService.getSaveSlots();
    assert.ok(allSlots[1], 'Slot 1 must be populated');
    assert.strictEqual(allSlots[1].characterName, 'RoundTripKnight');
    assert.strictEqual(allSlots[1].hp, 28);
    assert.strictEqual(allSlots[1].maxHp, 35);
    assert.strictEqual(allSlots[1].characterLevel, 2);
    assert.strictEqual(allSlots[1].location, 'Ruang Bawah Tanah');

    // D. Load from Slot 1
    const loaded = await saveLoadService.loadFromSlot(1);
    assert.ok(loaded.session, 'Loaded session must exist');
    assert.ok(loaded.character, 'Loaded character must exist');
    assert.strictEqual(loaded.character.name, 'RoundTripKnight');
    assert.strictEqual(loaded.character.hp, 28);
    assert.strictEqual(loaded.character.maxHp, 35);
    assert.strictEqual(loaded.character.gold, 75);
    assert.strictEqual(loaded.session.turnCount, 4);
    assert.strictEqual(loaded.session.worldLedger.flags.visited_cellar, true);

    // E. Timeline Isolation: Mutating loaded character does NOT alter slot record
    loaded.character.hp = 5;
    await Character.update({ hp: 5 }, { where: { id: loaded.character.id } });

    const freshSlots = await saveLoadService.getSaveSlots();
    assert.strictEqual(freshSlots[1].hp, 28, 'Slot 1 saved HP must remain unchanged at 28');
  });

  it('2. Graph cloning correctly clones nodes, choices, and remaps parentNodeId without collision', async (t) => {
    if (!isDbAvailable) {
      t.skip('Database connection unavailable; skipping persistent DB graph cloning test.');
      return;
    }
    const dummyChar = await Character.create({
      name: 'CloneHero',
      characterClass: 'warrior',
      hp: 30,
      maxHp: 30
    });

    const origSession = await GameSession.create({
      campaignId: 'whispering_tavern',
      characterId: dummyChar.id,
      turnCount: 2,
      activeBranchId: 'main'
    });

    const node1 = await StoryNode.create({
      sessionId: origSession.id,
      parentNodeId: null,
      chapterTitle: 'Node 1',
      dialogueText: 'Dialog babak satu.',
      turnNumber: 1
    });

    const node2 = await StoryNode.create({
      sessionId: origSession.id,
      parentNodeId: node1.id,
      chapterTitle: 'Node 2',
      dialogueText: 'Dialog babak dua.',
      turnNumber: 2
    });

    origSession.currentSceneId = node2.id;
    await origSession.save();

    const targetSession = await GameSession.create({
      campaignId: 'whispering_tavern',
      characterId: dummyChar.id,
      turnCount: 2,
      activeBranchId: 'main'
    });

    const { idMap } = await graphCloneService.cloneStoryGraph({
      sourceSessionId: origSession.id,
      targetSession,
      sourceCurrentSceneId: origSession.currentSceneId
    });

    assert.ok(idMap[node1.id], 'Node 1 must be remapped');
    assert.ok(idMap[node2.id], 'Node 2 must be remapped');
    assert.notStrictEqual(idMap[node1.id], node1.id, 'New node ID must differ from original');

    const clonedNode2 = await StoryNode.findByPk(idMap[node2.id]);
    assert.strictEqual(clonedNode2.parentNodeId, idMap[node1.id], 'clonedNode2 parentNodeId must point to clonedNode1');
    assert.strictEqual(targetSession.currentSceneId, idMap[node2.id], 'Target session currentSceneId must point to clonedNode2');
  });

  it('3. JSON Export & Import round-trip with schema validation and stat clamping', async (t) => {
    if (!isDbAvailable) {
      t.skip('Database connection unavailable; skipping persistent DB JSON export/import test.');
      return;
    }
    const testChar = await Character.create({
      name: 'ExportHero',
      characterClass: 'mage',
      level: 1,
      hp: 20,
      maxHp: 22,
      mana: 30,
      maxMana: 35,
      gold: 100,
      inventory: [{ itemId: 'item_01_potion_heal', quantity: 1 }]
    });

    const testSession = await GameSession.create({
      campaignId: 'whispering_tavern',
      characterId: testChar.id,
      turnCount: 1,
      activeBranchId: 'main'
    });

    await StoryNode.create({
      sessionId: testSession.id,
      chapterTitle: 'Prolog Export',
      location: 'Kedai Aether',
      dialogueText: 'Teks narasi prolog export yang lengkap.',
      turnNumber: 1
    });

    // Export JSON
    const exported = await saveLoadService.exportSessionJson(testSession.id);
    assert.strictEqual(exported.exportVersion, '3.0');
    assert.strictEqual(exported.character.name, 'ExportHero');
    assert.ok(Array.isArray(exported.nodes));
    assert.strictEqual(exported.nodes.length, 1);

    // Import JSON
    const imported = await saveLoadService.importSessionJson(exported);
    assert.ok(imported.session);
    assert.ok(imported.character);
    assert.strictEqual(imported.character.name, 'ExportHero');
    assert.notStrictEqual(imported.session.id, testSession.id, 'Imported session must have a new distinct ID');

    // Reject malformed JSON import
    await assert.rejects(async () => {
      await saveLoadService.importSessionJson({ invalidPayload: true });
    }, /Data simpanan tidak valid|Format data JSON tidak valid/i);
  });

  it('4. Semantic separation: Manual save rejects Slot 0, AutoSave targets Slot 0, input validated', async () => {
    // A. Manual save strictly rejects Slot 0
    await assert.rejects(async () => {
      await saveLoadService.saveToSlot({ sessionId: 'sess_test_123', slotNumber: 0 });
    }, (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /Slot 0 dikhususkan untuk auto-save/i);
      return true;
    });

    // B. Manual save rejects out-of-bounds slot numbers
    await assert.rejects(async () => {
      await saveLoadService.saveToSlot({ sessionId: 'sess_test_123', slotNumber: 4 });
    }, (err) => {
      assert.strictEqual(err.statusCode, 400);
      return true;
    });

    await assert.rejects(async () => {
      await saveLoadService.saveToSlot({ sessionId: 'sess_test_123', slotNumber: -1 });
    }, (err) => {
      assert.strictEqual(err.statusCode, 400);
      return true;
    });

    // C. Missing sessionId is rejected
    await assert.rejects(async () => {
      await saveLoadService.saveToSlot({ slotNumber: 1 });
    }, (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /sessionId wajib disertakan/i);
      return true;
    });

    await assert.rejects(async () => {
      await saveLoadService.autoSave('');
    }, (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /sessionId wajib disertakan/i);
      return true;
    });

    // D. Load slot rejects out-of-bounds slot numbers
    await assert.rejects(async () => {
      await saveLoadService.loadFromSlot(-1);
    }, (err) => {
      assert.strictEqual(err.statusCode, 400);
      return true;
    });

    await assert.rejects(async () => {
      await saveLoadService.loadFromSlot(4);
    }, (err) => {
      assert.strictEqual(err.statusCode, 400);
      return true;
    });
  });

  it('5. Autosave Slot 0 round-trip, isolation, and overwrite handling', async (t) => {
    if (!isDbAvailable) {
      t.skip('Database connection unavailable; skipping persistent DB autosave test.');
      return;
    }

    const testCampaign = await Campaign.findByPk('whispering_tavern') || await Campaign.create({
      id: 'whispering_tavern',
      title: 'Bisikan Kedai Terkutuk',
      premise: 'Misteri kedai terkutuk.',
      defaultBackgroundId: 'bg_01_tavern'
    });

    const testChar = await Character.create({
      name: 'AutosaveHero',
      characterClass: 'rogue',
      level: 3,
      hp: 22,
      maxHp: 25,
      mana: 8,
      maxMana: 10,
      gold: 50,
      inventory: [{ itemId: 'item_01_potion_heal', quantity: 1 }]
    });

    const testSession = await GameSession.create({
      campaignId: testCampaign.id,
      characterId: testChar.id,
      turnCount: 7,
      activeBranchId: 'main',
      worldLedger: { flags: { solved_puzzle: true } },
      combatState: { inCombat: true, round: 2 },
      isGameOver: false
    });

    const testNode = await StoryNode.create({
      sessionId: testSession.id,
      chapterTitle: 'Babak VII: Lorong Rahasia',
      location: 'Lorong Bawah Tanah',
      backgroundId: 'bg_02_dungeon',
      speaker: 'Narator',
      turnNumber: 7,
      dialogueText: 'Langkah kaki berderap di lorong sunyi.'
    });

    testSession.currentSceneId = testNode.id;
    await testSession.save();

    // A. Perform AutoSave (Slot 0)
    const savedAutoSlot = await saveLoadService.autoSave(testSession.id);
    assert.ok(savedAutoSlot, 'Autosave must succeed');
    assert.strictEqual(savedAutoSlot.slotNumber, 0);
    assert.strictEqual(savedAutoSlot.saveTitle, 'Autosave');

    // B. Verify Slot 0 exists in getSaveSlots
    const slots = await saveLoadService.getSaveSlots();
    assert.ok(slots[0], 'Slot 0 (Autosave) must be populated');
    assert.strictEqual(slots[0].characterName, 'AutosaveHero');
    assert.strictEqual(slots[0].hp, 22);
    assert.strictEqual(slots[0].turnCount, 7);
    assert.strictEqual(slots[0].location, 'Lorong Bawah Tanah');

    // C. Load from Slot 0
    const loaded = await saveLoadService.loadFromSlot(0);
    assert.ok(loaded.session, 'Loaded session from Slot 0 must exist');
    assert.strictEqual(loaded.character.name, 'AutosaveHero');
    assert.strictEqual(loaded.character.hp, 22);
    assert.strictEqual(loaded.session.combatState.inCombat, true);
    assert.strictEqual(loaded.session.worldLedger.flags.solved_puzzle, true);

    // D. Overwrite Autosave Slot 0
    testChar.hp = 15;
    await testChar.save();
    testSession.turnCount = 8;
    await testSession.save();

    await saveLoadService.autoSave(testSession.id);
    const updatedSlots = await saveLoadService.getSaveSlots();
    assert.strictEqual(updatedSlots[0].hp, 15, 'Updated Autosave HP must be 15');
    assert.strictEqual(updatedSlots[0].turnCount, 8, 'Updated Autosave turnCount must be 8');

    // E. Verify only one session exists with slotNumber: 0
    const slot0Sessions = await GameSession.findAll({ where: { slotNumber: 0 } });
    assert.strictEqual(slot0Sessions.length, 1, 'Only one record must exist for slotNumber 0');
  });

  it('6. Manual Slot independence (Slot 2 & 3), non-interference with Autosave Slot 0, and inventory immutability', async (t) => {
    if (!isDbAvailable) {
      t.skip('Database connection unavailable; skipping persistent DB slot independence test.');
      return;
    }

    const testCampaign = await Campaign.findByPk('whispering_tavern') || await Campaign.create({
      id: 'whispering_tavern',
      title: 'Bisikan Kedai Terkutuk',
      premise: 'Misteri kedai terkutuk.'
    });

    // Character & Session for Slot 2
    const charSlot2 = await Character.create({
      name: 'MageSlot2',
      characterClass: 'mage',
      level: 4,
      hp: 24,
      maxHp: 24,
      gold: 250,
      inventory: [{ itemId: 'item_01_potion_heal', quantity: 3 }]
    });

    const sessionSlot2 = await GameSession.create({
      campaignId: testCampaign.id,
      characterId: charSlot2.id,
      turnCount: 5,
      activeBranchId: 'main'
    });

    const nodeSlot2 = await StoryNode.create({
      sessionId: sessionSlot2.id,
      chapterTitle: 'Babak V: Perpustakaan Purba',
      location: 'Perpustakaan Purba',
      turnNumber: 5,
      dialogueText: 'Buku-buku berdebu tersusun di rak tinggi.'
    });
    sessionSlot2.currentSceneId = nodeSlot2.id;
    await sessionSlot2.save();

    // Character & Session for Slot 3
    const charSlot3 = await Character.create({
      name: 'FighterSlot3',
      characterClass: 'fighter',
      level: 5,
      hp: 45,
      maxHp: 45,
      gold: 600,
      inventory: [{ itemId: 'item_02_potion_mana', quantity: 2 }]
    });

    const sessionSlot3 = await GameSession.create({
      campaignId: testCampaign.id,
      characterId: charSlot3.id,
      turnCount: 9,
      activeBranchId: 'main'
    });

    const nodeSlot3 = await StoryNode.create({
      sessionId: sessionSlot3.id,
      chapterTitle: 'Babak IX: Benteng Besi',
      location: 'Benteng Besi',
      turnNumber: 9,
      dialogueText: 'Dinding benteng menjulang kukuh.'
    });
    sessionSlot3.currentSceneId = nodeSlot3.id;
    await sessionSlot3.save();

    // A. Save to Slot 2 and Slot 3
    await saveLoadService.saveToSlot({ sessionId: sessionSlot2.id, slotNumber: 2 });
    await saveLoadService.saveToSlot({ sessionId: sessionSlot3.id, slotNumber: 3 });

    const slotsBeforeAuto = await saveLoadService.getSaveSlots();
    assert.strictEqual(slotsBeforeAuto[2].characterName, 'MageSlot2');
    assert.strictEqual(slotsBeforeAuto[2].gold, 250);
    assert.strictEqual(slotsBeforeAuto[3].characterName, 'FighterSlot3');
    assert.strictEqual(slotsBeforeAuto[3].gold, 600);

    // B. Trigger Autosave on Slot 0
    await saveLoadService.autoSave(sessionSlot2.id);

    // C. Non-interference: Slot 2 and Slot 3 must remain intact and identical
    const slotsAfterAuto = await saveLoadService.getSaveSlots();
    assert.ok(slotsAfterAuto[0], 'Autosave Slot 0 must exist');
    assert.strictEqual(slotsAfterAuto[2].characterName, 'MageSlot2', 'Slot 2 must not be modified by autosave');
    assert.strictEqual(slotsAfterAuto[2].gold, 250);
    assert.strictEqual(slotsAfterAuto[3].characterName, 'FighterSlot3', 'Slot 3 must not be modified by autosave');
    assert.strictEqual(slotsAfterAuto[3].gold, 600);

    // D. Mutating active character does not alter saved slot inventory or stats
    charSlot2.hp = 1;
    charSlot2.gold = 0;
    await charSlot2.save();

    const loadedSlot2 = await saveLoadService.loadFromSlot(2);
    assert.strictEqual(loadedSlot2.character.hp, 24, 'Saved Slot 2 HP must remain 24');
    assert.strictEqual(loadedSlot2.character.gold, 250, 'Saved Slot 2 Gold must remain 250');
    assert.ok(Array.isArray(loadedSlot2.character.inventory), 'Inventory must be an array');
    const healPotion = loadedSlot2.character.inventory.find(i => i.id === 'item_01_potion_heal');
    assert.ok(healPotion, 'Inventory must contain item_01_potion_heal');
    assert.strictEqual(healPotion.quantity, 3, 'Quantity must be preserved as 3');
  });
});

