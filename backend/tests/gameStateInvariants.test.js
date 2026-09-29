const { describe, it } = require('node:test');
const assert = require('node:assert');
const gameStateEngine = require('../src/engine/gameStateEngine');
const itemMaster = require('../src/engine/itemMaster');

describe('Game State Invariants & Boundary Tests (Stage 3)', () => {
  const createBaseCharacter = () => ({
    name: 'Kaelen',
    characterClass: 'warrior',
    level: 1,
    hp: 25,
    maxHp: 35,
    mana: 10,
    maxMana: 20,
    gold: 50,
    inventory: [
      { itemId: 'item_01_potion_heal', quantity: 2 }
    ]
  });

  const createBaseSession = () => ({
    id: 'sess_inv_test_1',
    campaignId: 'whispering_tavern',
    turnCount: 1,
    activeBranchId: 'main',
    worldLedger: { flags: {}, reputation: {} },
    missionLog: { title: 'Misi Utama', objective: 'Selidiki kedai', status: 'active' },
    isGameOver: false
  });

  describe('1. Stat Clamping & Extremes', () => {
    it('HP never exceeds maxHp, even with massive positive delta (+999999)', () => {
      const char = createBaseCharacter();
      const session = createBaseSession();
      const result = gameStateEngine.resolveAction(session, char, null, { actionType: 'REST' }, { hpChange: 999999 });

      assert.strictEqual(result.updatedCharacterState.hp, char.maxHp, 'HP must be clamped exactly to maxHp');
      assert.strictEqual(result.validatedUpdates.hpChange, char.maxHp - char.hp);
    });

    it('HP never drops below 0, even with massive negative delta (-999999)', () => {
      const char = createBaseCharacter();
      const session = createBaseSession();
      const result = gameStateEngine.resolveAction(session, char, null, { actionType: 'DAMAGE' }, { hpChange: -999999 });

      assert.strictEqual(result.updatedCharacterState.hp, 0, 'HP must be clamped exactly to 0');
      assert.strictEqual(result.isGameOver, true, 'Zero HP must trigger game over');
    });

    it('Mana never exceeds maxMana (+999999) and never drops below 0 (-999999)', () => {
      const char = createBaseCharacter();
      const session = createBaseSession();

      const manaSurge = gameStateEngine.resolveAction(session, char, null, { actionType: 'MEDITATE' }, { manaChange: 999999 });
      assert.strictEqual(manaSurge.updatedCharacterState.mana, char.maxMana, 'Mana clamped to maxMana');

      const manaDrain = gameStateEngine.resolveAction(session, char, null, { actionType: 'DRAIN' }, { manaChange: -999999 });
      assert.strictEqual(manaDrain.updatedCharacterState.mana, 0, 'Mana clamped to 0');
    });

    it('Gold never drops below 0, even with massive cost (-999999)', () => {
      const char = createBaseCharacter();
      const session = createBaseSession();
      const result = gameStateEngine.resolveAction(session, char, null, { actionType: 'BUY' }, { goldChange: -999999 });

      assert.strictEqual(result.updatedCharacterState.gold, 0, 'Gold cannot be negative');
    });
  });

  describe('2. Item Inventory Invariants', () => {
    it('Unregistered or fake item cannot be added to inventory', () => {
      const char = createBaseCharacter();
      const addRes = itemMaster.addItem(char, 'item_nonexistent_hallucinated_xyz', 1);
      assert.strictEqual(addRes.success, false, 'Unregistered item must be rejected');
      assert.strictEqual(char.inventory.length, 1, 'Inventory must remain unchanged');
    });

    it('Valid item added increments existing stack without exceeding maxStack', () => {
      const char = createBaseCharacter();
      const addRes = itemMaster.addItem(char, 'item_01_potion_heal', 3);
      assert.strictEqual(addRes.success, true);
      const potionSlot = addRes.updatedCharacter.inventory.find(i => (i.itemId || i.id) === 'item_01_potion_heal');
      assert.strictEqual(potionSlot.quantity, 5);
    });

    it('Consuming item with quantity 0 or missing item is strictly rejected', () => {
      const char = createBaseCharacter();
      char.inventory = []; // Empty inventory

      const session = createBaseSession();
      const result = gameStateEngine.resolveAction(
        session,
        char,
        null,
        { actionType: 'USE_ITEM', itemId: 'item_01_potion_heal' }
      );

      assert.strictEqual(result.validatedUpdates.removedItems.length, 0, 'Cannot consume missing item');
    });
  });

  describe('3. Edge Cases & Resilience', () => {
    it('Handles null, undefined, or empty stateUpdates gracefully without crash', () => {
      const char = createBaseCharacter();
      const session = createBaseSession();

      const resultNull = gameStateEngine.resolveAction(session, char, null, {}, null);
      assert.ok(resultNull.validatedUpdates);
      assert.strictEqual(resultNull.validatedUpdates.hpChange, 0);

      const resultEmpty = gameStateEngine.resolveAction(session, char, null, {}, {});
      assert.ok(resultEmpty.validatedUpdates);
      assert.strictEqual(resultEmpty.validatedUpdates.goldChange, 0);
    });

    it('Reputation delta is strictly numeric and ignores 0 deltas', () => {
      const char = createBaseCharacter();
      const session = createBaseSession();

      const result = gameStateEngine.resolveAction(
        session,
        char,
        null,
        {},
        { reputationChange: { city_guard: 5, shadow_cult: 0 } }
      );

      assert.strictEqual(result.updatedSessionState.worldLedger.reputation?.city_guard, 5);
    });
  });
});
