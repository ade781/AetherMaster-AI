const { describe, it } = require('node:test');
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
  it('1. SaveToSlot and LoadFromSlot round-trip preserves state accurately', async () => {
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

  it('2. Graph cloning correctly clones nodes, choices, and remaps parentNodeId without collision', async () => {
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

  it('3. JSON Export & Import round-trip with schema validation and stat clamping', async () => {
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
});
