import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMod } from '../src/utils/rpgMath.js';

describe('Frontend RPG Math Utility', () => {
  it('should calculate modifier correctly for D&D 5E attribute scores', () => {
    assert.equal(calculateMod(10), '+0');
    assert.equal(calculateMod(11), '+0');
    assert.equal(calculateMod(12), '+1');
    assert.equal(calculateMod(14), '+2');
    assert.equal(calculateMod(16), '+3');
    assert.equal(calculateMod(18), '+4');
    assert.equal(calculateMod(20), '+5');
  });

  it('should calculate negative modifiers correctly', () => {
    assert.equal(calculateMod(9), '-1');
    assert.equal(calculateMod(8), '-1');
    assert.equal(calculateMod(7), '-2');
    assert.equal(calculateMod(6), '-2');
    assert.equal(calculateMod(1), '-5');
  });
});
