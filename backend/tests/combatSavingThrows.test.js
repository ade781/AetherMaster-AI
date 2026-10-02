const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  savingThrowEvaluator,
  combatEngine
} = require('../src/engine');

describe('D&D 5E Combat Saving Throws & Status Effects (Phase 2)', () => {

  describe('1. Saving Throw Evaluator Core Rules', () => {
    it('evaluates saving throw based on attribute modifier and DC', () => {
      const character = {
        name: 'Acrobatic Rogue',
        dex: 16, // modifier +3
        con: 14, // modifier +2
        statusEffects: []
      };

      // Guaranteed pass: roll 10 + dexMod 3 = 13 vs DC 12
      const passResult = savingThrowEvaluator.evaluateSavingThrow({
        character,
        ability: 'dex',
        dc: 12,
        rollOverride: 10
      });

      assert.strictEqual(passResult.success, true);
      assert.strictEqual(passResult.modifier, 3);
      assert.strictEqual(passResult.total, 13);
      assert.strictEqual(passResult.dc, 12);
      assert.match(passResult.log, /berhasil/i);

      // Guaranteed fail: roll 6 + dexMod 3 = 9 vs DC 12
      const failResult = savingThrowEvaluator.evaluateSavingThrow({
        character,
        ability: 'dex',
        dc: 12,
        rollOverride: 6
      });

      assert.strictEqual(failResult.success, false);
      assert.strictEqual(failResult.total, 9);
      assert.match(failResult.log, /gagal/i);
    });

    it('applies Blessed status effect bonus (+1d4) to saving throws', () => {
      const blessedChar = {
        name: 'Blessed Cleric',
        wis: 14, // modifier +2
        statusEffects: ['blessed']
      };

      // Roll 8 + wisMod 2 + blessedBonus 3 = 13 vs DC 12 -> pass
      const result = savingThrowEvaluator.evaluateSavingThrow({
        character: blessedChar,
        ability: 'wis',
        dc: 12,
        rollOverride: 8,
        blessedRollOverride: 3
      });

      assert.strictEqual(result.isBlessed, true);
      assert.strictEqual(result.blessedBonus, 3);
      assert.strictEqual(result.total, 13);
      assert.strictEqual(result.success, true);
      assert.match(result.log, /blessed/i);
    });

    it('correctly calculates Spell Save DC according to D&D 5E rules', () => {
      const wizard = {
        level: 5, // proficiency bonus = 2 + floor(4/4) = 3
        int: 18, // modifier = +4
      };
      // DC = 8 + 3 + 4 = 15
      const dc = savingThrowEvaluator.calculateSpellSaveDC(wizard, 'int');
      assert.strictEqual(dc, 15);
    });
  });

  describe('2. Combat Engine Turn-Based Status Effects', () => {
    it('poisoned condition inflicts 1d4 damage over time at turn start', () => {
      const session = {
        combatState: {
          inCombat: true,
          round: 1,
          enemy: {
            id: 'cave_spider',
            name: 'Cave Spider',
            hp: 30,
            maxHp: 30,
            ac: 12,
            attackBonus: 2,
            damageBonus: 1,
            damageDice: 4
          },
          combatLog: []
        }
      };

      const character = {
        name: 'Poisoned Fighter',
        hp: 20,
        maxHp: 20,
        str: 14,
        statusEffects: ['poisoned'],
        inventory: []
      };

      const result = combatEngine.executeCombatAction({
        session,
        character,
        currentNode: { combatEncounter: session.combatState.enemy },
        action: 'ATTACK'
      });

      assert.strictEqual(result.success, true);
      assert.ok(character.hp < 20, 'Character HP must decrease due to poison damage');
      const hasPoisonLog = result.combatState.combatLog.some(log => /Poisoned/i.test(log));
      assert.strictEqual(hasPoisonLog, true, 'Combat log must record poison damage');
    });

    it('poisoned condition drops player into defeat if HP reaches 0', () => {
      const session = {
        combatState: {
          inCombat: true,
          round: 2,
          enemy: {
            id: 'toxic_viper',
            name: 'Toxic Viper',
            hp: 30,
            maxHp: 30,
            ac: 12,
            attackBonus: 2,
            damageBonus: 1
          },
          combatLog: []
        }
      };

      const character = {
        name: 'Dying Fighter',
        hp: 1, // Only 1 HP left, 1d4 will reduce to 0
        maxHp: 20,
        str: 14,
        statusEffects: ['poisoned'],
        inventory: []
      };

      const result = combatEngine.executeCombatAction({
        session,
        character,
        currentNode: { combatEncounter: session.combatState.enemy },
        action: 'ATTACK'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(character.hp, 0);
      assert.strictEqual(result.isGameOver, true);
      assert.strictEqual(result.combatState.inCombat, false);
      assert.strictEqual(result.combatState.isDefeat, true);
      assert.match(result.actionLog, /tumbang binasa akibat racun mematikan/i);
    });

    it('stunned condition forces character to skip their action turn', () => {
      const session = {
        combatState: {
          inCombat: true,
          round: 1,
          enemy: {
            id: 'mind_flayer_adept',
            name: 'Mind Flayer Adept',
            hp: 40,
            maxHp: 40,
            ac: 14,
            attackBonus: 3,
            damageBonus: 2,
            damageDice: 6
          },
          combatLog: []
        }
      };

      const character = {
        name: 'Stunned Warrior',
        hp: 30,
        maxHp: 30,
        str: 16,
        armorClass: 15,
        statusEffects: ['stunned'],
        inventory: []
      };

      const enemyInitialHp = session.combatState.enemy.hp;

      const result = combatEngine.executeCombatAction({
        session,
        character,
        currentNode: { combatEncounter: session.combatState.enemy },
        action: 'ATTACK'
      });

      assert.strictEqual(result.success, true);
      // Enemy must not have taken damage because player turn was stunned/skipped
      assert.strictEqual(result.combatState.enemy.hp, enemyInitialHp, 'Enemy HP should remain untouched');
      assert.strictEqual(result.playerDamageDealt, 0);
      const hasStunnedLog = result.combatState.combatLog.some(log => /Stunned.*tidak berdaya/i.test(log));
      assert.strictEqual(hasStunnedLog, true, 'Combat log must record stunned skip');
    });

    it('blessed condition adds +1d4 bonus to player attack roll', () => {
      const session = {
        combatState: {
          inCombat: true,
          round: 1,
          enemy: {
            id: 'iron_automaton',
            name: 'Iron Automaton',
            hp: 30,
            maxHp: 30,
            ac: 15,
            attackBonus: 1,
            damageBonus: 1,
            damageDice: 4
          },
          combatLog: []
        }
      };

      const character = {
        name: 'Blessed Paladin',
        hp: 30,
        maxHp: 30,
        str: 12,
        statusEffects: [{ name: 'blessed' }], // Object statusEffect format support
        inventory: []
      };

      const result = combatEngine.executeCombatAction({
        session,
        character,
        currentNode: { combatEncounter: session.combatState.enemy },
        action: 'ATTACK'
      });

      assert.strictEqual(result.success, true);
      const hasBlessedLog = result.combatState.combatLog.some(log => /blessed/i.test(log));
      assert.strictEqual(hasBlessedLog, true, 'Combat log must record blessed bonus roll');
    });
  });
});
