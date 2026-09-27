const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const combatEngine = require('../src/engine/combatEngine');

describe('Combat Engine Tests (Server-Side Rules)', () => {

  // Test 4: Combat Validation Test (Tolak Combat Siluman)
  describe('Tugas 1 & Test 4: Combat Validation (No Phantom Encounters)', () => {
    it('should reject combat when currentNode has no combat encounter and session is not in combat', () => {
      const session = { combatState: null };
      const currentNode = { combatEncounter: null };

      const validation = combatEngine.validateCombatEncounter(session, currentNode);
      assert.strictEqual(validation.valid, false);
      assert.match(validation.error, /Tidak ada encounter pertarungan aktif/i);

      // Executing combat action directly must fail with 400
      const result = combatEngine.executeCombatAction({
        session,
        character: { name: 'Hero', hp: 30, maxHp: 30, mana: 15, maxMana: 15, str: 14, dex: 12 },
        currentNode,
        action: 'ATTACK'
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.statusCode, 400);
      assert.match(result.error, /Tidak ada encounter pertarungan aktif/i);
    });

    it('should reject combat if encounter has 0 or negative HP', () => {
      const session = { combatState: null };
      const currentNode = {
        combatEncounter: {
          enemyName: 'Tengkorak Rusak',
          enemyHp: 0
        }
      };

      const validation = combatEngine.validateCombatEncounter(session, currentNode);
      assert.strictEqual(validation.valid, false);
      assert.match(validation.error, /tidak valid atau musuh sudah dikalahkan/i);
    });

    it('should accept valid combat encounter and initialize state properly', () => {
      const session = { combatState: null };
      const currentNode = {
        combatEncounter: {
          enemyId: 'goblin_raider',
          enemyName: 'Goblin Raider',
          enemyHp: 20,
          enemyAc: 11,
          enemyAttack: 2,
          damageBonus: 1
        }
      };

      const validation = combatEngine.validateCombatEncounter(session, currentNode);
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.encounter.enemyName, 'Goblin Raider');

      const combatState = combatEngine.initCombatState(validation.encounter);
      assert.strictEqual(combatState.inCombat, true);
      assert.strictEqual(combatState.enemy.name, 'Goblin Raider');
      assert.strictEqual(combatState.enemy.hp, 20);
      assert.strictEqual(combatState.enemy.ac, 11);
    });
  });

  // Test 5: Combat Damage Calculation Test
  describe('Test 5: Combat Damage & Turn Calculations', () => {
    it('should calculate attack damage and enemy counter-attack deterministically on server', () => {
      const session = {
        combatState: {
          inCombat: true,
          round: 1,
          enemy: {
            id: 'orc_warrior',
            name: 'Orc Warrior',
            hp: 50,
            maxHp: 50,
            ac: 10,
            attackBonus: 3,
            damageBonus: 2,
            damageDice: 6
          },
          combatLog: []
        }
      };

      const character = {
        name: 'Paladin Ronald',
        hp: 35,
        maxHp: 35,
        mana: 15,
        maxMana: 15,
        str: 16,
        dex: 12,
        armorClass: 16,
        inventory: []
      };

      const currentNode = {
        combatEncounter: session.combatState.enemy
      };

      const result = combatEngine.executeCombatAction({
        session,
        character,
        currentNode,
        action: 'ATTACK'
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.combatState);
      assert.ok(Array.isArray(result.combatState.combatLog));
      assert.ok(result.combatState.combatLog.length > 0);

      // Enemy HP should never be greater than initial 50
      assert.ok(result.combatState.enemy.hp <= 50);
      // Character HP should never exceed maxHp (35)
      assert.ok(character.hp <= 35);
    });

    it('should deduct mana on spellcast and deal spell damage', () => {
      const session = {
        combatState: {
          inCombat: true,
          round: 1,
          enemy: {
            id: 'shadow_stalker',
            name: 'Shadow Stalker',
            hp: 40,
            maxHp: 40,
            ac: 13,
            attackBonus: 2,
            damageBonus: 1,
            damageDice: 4
          },
          combatLog: []
        }
      };

      const character = {
        name: 'Mage Val',
        hp: 24,
        maxHp: 24,
        mana: 20,
        maxMana: 20,
        int: 17,
        wis: 14,
        cha: 10,
        armorClass: 12,
        inventory: []
      };

      const initialMana = character.mana;
      const initialEnemyHp = session.combatState.enemy.hp;

      const result = combatEngine.executeCombatAction({
        session,
        character,
        currentNode: { combatEncounter: session.combatState.enemy },
        action: 'CAST_SPELL'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(character.mana, initialMana - 5, 'Must deduct exactly 5 mana');
      assert.ok(result.combatState.enemy.hp < initialEnemyHp, 'Enemy must receive spell damage');
    });

    it('should reject spellcast when player has insufficient mana', () => {
      const session = {
        combatState: {
          inCombat: true,
          round: 1,
          enemy: {
            id: 'golem',
            name: 'Stone Golem',
            hp: 40,
            maxHp: 40,
            ac: 14,
            attackBonus: 2,
            damageBonus: 2,
            damageDice: 6
          },
          combatLog: []
        }
      };

      const character = {
        name: 'Exhausted Mage',
        hp: 20,
        maxHp: 20,
        mana: 3, // less than 5
        maxMana: 20,
        int: 16,
        inventory: []
      };

      const result = combatEngine.executeCombatAction({
        session,
        character,
        currentNode: { combatEncounter: session.combatState.enemy },
        action: 'CAST_SPELL'
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.statusCode, 400);
      assert.match(result.error, /Mana tidak mencukupi/i);
    });

    it('should trigger victory and award gold when enemy HP drops to 0', () => {
      const session = {
        combatState: {
          inCombat: true,
          round: 3,
          enemy: {
            id: 'weak_rat',
            name: 'Giant Rat',
            hp: 1, // 1 HP left, will be defeated
            maxHp: 10,
            ac: 5,
            goldReward: 30,
            attackBonus: 1,
            damageBonus: 1,
            damageDice: 4
          },
          combatLog: []
        }
      };

      const character = {
        name: 'Hunter',
        hp: 25,
        maxHp: 25,
        gold: 10,
        str: 16,
        inventory: []
      };

      let result;
      for (let attempt = 0; attempt < 5; attempt++) {
        session.combatState.enemy.hp = 1;
        character.hp = 25;
        result = combatEngine.executeCombatAction({
          session,
          character,
          currentNode: { combatEncounter: session.combatState.enemy },
          action: 'ATTACK'
        });
        if (result.isVictory) break;
      }

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isVictory, true);
      assert.strictEqual(result.combatState.inCombat, false);
      assert.strictEqual(result.combatState.enemy.hp, 0);
      assert.ok(character.gold >= 40, 'Must award 30 gold upon victory');
      assert.match(result.actionLog, /KEMENANGAN MUTLAK/i);
    });

    it('should trigger defeat and game over when character HP drops to 0', () => {
      const session = {
        isGameOver: false,
        combatState: {
          inCombat: true,
          round: 4,
          enemy: {
            id: 'dragon',
            name: 'Red Dragon',
            hp: 200,
            maxHp: 200,
            ac: 18,
            attackBonus: 20, // Guaranteed hit
            damageBonus: 50, // Guaranteed fatal damage
            damageDice: 12
          },
          combatLog: []
        }
      };

      const character = {
        name: 'Doomed Hero',
        hp: 5,
        maxHp: 30,
        armorClass: 10,
        str: 10,
        inventory: []
      };

      let result;
      for (let i = 0; i < 5; i++) {
        result = combatEngine.executeCombatAction({
          session,
          character,
          currentNode: { combatEncounter: session.combatState.enemy },
          action: 'ATTACK'
        });
        if (result.isGameOver) break;
      }

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isGameOver, true);
      assert.strictEqual(character.hp, 0, 'Character HP must be clamped to 0');
      assert.strictEqual(result.combatState.inCombat, false);
      assert.strictEqual(result.combatState.isDefeat, true);
    });
  });
});
