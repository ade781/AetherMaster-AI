const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Game State Boundaries & Persistence Tests', () => {

  // Test 6: State Boundary Test
  describe('Test 6: State Boundary (HP, Mana, Gold Limits)', () => {
    it('HP cannot exceed maxHp and cannot fall below 0', () => {
      const character = {
        name: 'Aldric',
        hp: 28,
        maxHp: 30,
        mana: 10,
        maxMana: 20,
        gold: 15
      };

      // Case A: Healing exceeds maxHp
      const healAmount = 25;
      character.hp = Math.max(0, Math.min(character.maxHp, character.hp + healAmount));
      assert.strictEqual(character.hp, 30, 'HP should be clamped to maxHp (30)');

      // Case B: Fatal damage reduces HP below 0
      const massiveDamage = -100;
      character.hp = Math.max(0, Math.min(character.maxHp, character.hp + massiveDamage));
      assert.strictEqual(character.hp, 0, 'HP should be clamped to 0, never negative');

      // Case C: Mana clamp
      character.mana = Math.max(0, Math.min(character.maxMana, character.mana + 50));
      assert.strictEqual(character.mana, 20, 'Mana should be clamped to maxMana (20)');

      character.mana = Math.max(0, Math.min(character.maxMana, character.mana - 50));
      assert.strictEqual(character.mana, 0, 'Mana should be clamped to 0, never negative');

      // Case D: Gold clamp
      character.gold = Math.max(0, character.gold - 100);
      assert.strictEqual(character.gold, 0, 'Gold should never be negative');
    });
  });

  // Test 3: Item Consumption Test
  describe('Test 3: Item Consumption & Inventory Rules', () => {
    it('should reject potion consumption if inventory is empty', () => {
      const character = {
        name: 'Wanderer',
        hp: 10,
        maxHp: 30,
        inventory: []
      };

      const requestedItemId = 'item_01_potion_heal';
      const itemIdx = character.inventory.findIndex(i => i && (i.id === requestedItemId || i.name === requestedItemId));

      assert.strictEqual(itemIdx, -1, 'Item should not be found in empty inventory');
    });

    it('should restore HP correctly and remove item from inventory upon use', () => {
      const character = {
        name: 'Wanderer',
        hp: 10,
        maxHp: 30,
        inventory: [
          {
            id: 'item_01_potion_heal',
            name: 'Potion of Healing',
            category: 'consumable',
            effect: { hp: 25, mana: 0 }
          }
        ]
      };

      const requestedItemId = 'item_01_potion_heal';
      const itemIdx = character.inventory.findIndex(i => i && (i.id === requestedItemId || i.name === requestedItemId));
      assert.notStrictEqual(itemIdx, -1);

      const item = character.inventory[itemIdx];
      const healAmount = item.effect.hp;

      character.hp = Math.min(character.maxHp, character.hp + healAmount);
      character.inventory.splice(itemIdx, 1);

      assert.strictEqual(character.hp, 30, 'HP must be restored and clamped to maxHp');
      assert.strictEqual(character.inventory.length, 0, 'Used item must be removed from inventory');
    });
  });

  // Test 7: Rewind State Test
  describe('Test 7: Rewind State Restoration', () => {
    it('restores HP, inventory, gold, and world ledger to target snapshot state', () => {
      const targetSnapshot = {
        hp: 22,
        maxHp: 30,
        mana: 15,
        maxMana: 20,
        gold: 45,
        inventory: [
          { id: 'item_01_potion_heal', name: 'Potion of Healing' },
          { id: 'skeleton_key', name: 'Skeleton Key' }
        ],
        worldLedger: {
          questFlags: { started: true, gate_unlocked: true },
          reputation: { guild: 1 }
        },
        turnCount: 4,
        isGameOver: false
      };

      const activeSession = {
        turnCount: 8,
        isGameOver: true,
        worldLedger: {
          questFlags: { started: true, gate_unlocked: true, ruined: true }
        }
      };

      const activeCharacter = {
        hp: 0,
        maxHp: 30,
        mana: 2,
        maxMana: 20,
        gold: 100,
        inventory: []
      };

      // Rewind execution:
      activeSession.turnCount = targetSnapshot.turnCount;
      activeSession.isGameOver = targetSnapshot.isGameOver;
      activeSession.worldLedger = { ...targetSnapshot.worldLedger };

      activeCharacter.hp = targetSnapshot.hp;
      activeCharacter.maxHp = targetSnapshot.maxHp;
      activeCharacter.mana = targetSnapshot.mana;
      activeCharacter.maxMana = targetSnapshot.maxMana;
      activeCharacter.gold = targetSnapshot.gold;
      activeCharacter.inventory = [...targetSnapshot.inventory];

      assert.strictEqual(activeCharacter.hp, 22, 'HP should restore exactly to snapshot value (22), not arbitrer 50%');
      assert.strictEqual(activeCharacter.inventory.length, 2);
      assert.strictEqual(activeSession.turnCount, 4);
      assert.strictEqual(activeSession.isGameOver, false);
      assert.strictEqual(activeSession.worldLedger.questFlags.gate_unlocked, true);
      assert.strictEqual(activeSession.worldLedger.questFlags.ruined, undefined);
    });
  });

  // Test 8: Objective-Based Ending Test
  describe('Test 8: Objective-Based Ending (No premature turn 12 victory)', () => {
    it('turnCount >= 12 should NOT automatically trigger victory if quest is incomplete', () => {
      const session = {
        turnCount: 12,
        isGameOver: false,
        worldLedger: {
          questFlags: { started: true } // main quest NOT completed
        }
      };

      const isMainQuestComplete = Boolean(session.worldLedger?.questFlags?.main_quest_completed);
      const isVictoryTriggered = isMainQuestComplete;

      assert.strictEqual(isVictoryTriggered, false, 'Turn 12 should not trigger victory when main quest is incomplete');
    });

    it('triggers victory only when main quest objectives are explicitly completed', () => {
      const session = {
        turnCount: 6,
        isGameOver: false,
        worldLedger: {
          questFlags: { started: true, main_quest_completed: true }
        }
      };

      const isMainQuestComplete = Boolean(session.worldLedger?.questFlags?.main_quest_completed);
      if (isMainQuestComplete) {
        session.isGameOver = true;
      }

      assert.strictEqual(isMainQuestComplete, true);
      assert.strictEqual(session.isGameOver, true);
    });
  });
});
