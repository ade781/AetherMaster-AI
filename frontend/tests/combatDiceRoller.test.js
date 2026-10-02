import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STATUS_EFFECTS_MAP } from '../src/utils/statusEffects.js';

describe('Frontend Tactical Combat Dice Roller & Conditions', () => {
  const resolveAttackRoll = (roll, statMod, targetAc) => {
    const isCrit20 = roll === 20;
    const isFumble1 = roll === 1;
    const totalAttack = roll + statMod;
    const isHit = isCrit20 || (!isFumble1 && totalAttack >= targetAc);

    return {
      roll,
      statMod,
      totalAttack,
      targetAc,
      isHit,
      isCriticalHit: isCrit20,
      isCriticalMiss: isFumble1
    };
  };

  it('should resolve Natural 20 as automatic Critical Hit regardless of AC', () => {
    // Impossible AC of 30, but rolled a Natural 20
    const result = resolveAttackRoll(20, 0, 30);

    assert.equal(result.isCriticalHit, true, 'Roll 20 harus critical hit');
    assert.equal(result.isCriticalMiss, false);
    assert.equal(result.isHit, true, 'Natural 20 harus selalu Hit');
  });

  it('should resolve Natural 1 as automatic Critical Miss regardless of high modifier', () => {
    // Target AC of 5, high modifier of +15, but rolled a Natural 1
    const result = resolveAttackRoll(1, 15, 5);

    assert.equal(result.isCriticalMiss, true, 'Roll 1 harus critical miss');
    assert.equal(result.isCriticalHit, false);
    assert.equal(result.isHit, false, 'Natural 1 harus selalu Miss');
  });

  it('should calculate standard D&D 5E attack rolls correctly against target AC', () => {
    // Roll 12 + Mod 3 = 15 vs AC 14 (Hit)
    const hitResult = resolveAttackRoll(12, 3, 14);
    assert.equal(hitResult.isHit, true);
    assert.equal(hitResult.totalAttack, 15);
    assert.equal(hitResult.isCriticalHit, false);
    assert.equal(hitResult.isCriticalMiss, false);

    // Roll 8 + Mod 2 = 10 vs AC 14 (Miss)
    const missResult = resolveAttackRoll(8, 2, 14);
    assert.equal(missResult.isHit, false);
    assert.equal(missResult.totalAttack, 10);
  });

  it('should validate all standard D&D 5E tactical status effects map definitions', () => {
    const requiredEffects = ['stunned', 'poisoned', 'blessed', 'shielded', 'burning', 'weakened'];

    for (const eff of requiredEffects) {
      const entry = STATUS_EFFECTS_MAP[eff];
      assert.ok(entry, `Status effect ${eff} harus terdaftar`);
      assert.ok(entry.label, `Label ${eff} harus ada`);
      assert.ok(entry.description, `Deskripsi ${eff} harus ada`);
      assert.ok(entry.color, `Warna ${eff} harus ada`);
      assert.ok(typeof entry.iconName === 'string' && entry.iconName.length > 0, `IconName ${eff} harus string`);
    }
  });
});
