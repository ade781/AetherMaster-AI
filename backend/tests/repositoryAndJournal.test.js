const test = require('node:test');
const assert = require('node:assert/strict');
const { ItemRepository, NPCRepository, LocationRepository, WorldFactRepository } = require('../src/repositories');
const { ITEM_CATALOG } = require('../src/engine/itemMaster');
const { sequelize } = require('../src/config/database');

test('Repository Layer: ItemRepository, NPCRepository, LocationRepository', async (t) => {
  t.after(async () => {
    try {
      await sequelize.close();
    } catch (e) {}
  });

  await t.test('ItemRepository should find canonical item and fallback gracefully', async () => {
    const item = await ItemRepository.findById('item_01_potion_heal');
    assert.ok(item, 'Item should be found');
    assert.strictEqual(item.name, 'Potion of Healing');

    const isConsumable = await ItemRepository.isConsumable('item_01_potion_heal');
    assert.strictEqual(isConsumable, true);
  });

  await t.test('ItemRepository findByCategory should return filtered items', async () => {
    const consumables = await ItemRepository.findByCategory('consumable');
    assert.ok(Array.isArray(consumables));
    assert.ok(consumables.length > 0);
    assert.ok(consumables.every(i => i.category === 'consumable'));
  });

  await t.test('NPCRepository and LocationRepository should return arrays on findAll', async () => {
    const npcs = await NPCRepository.findAll();
    assert.ok(Array.isArray(npcs));

    const locations = await LocationRepository.findAll();
    assert.ok(Array.isArray(locations));
  });

  await t.test('WorldFactRepository handles invalid input gracefully', async () => {
    const fact = await WorldFactRepository.addFact({ sessionId: null, fact: null });
    assert.strictEqual(fact, null);

    const sessionFacts = await WorldFactRepository.findBySession(null);
    assert.deepStrictEqual(sessionFacts, []);
  });
});
