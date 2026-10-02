const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { aiDirectorEngine } = require('../src/engine');

describe('AI Director & Pacing Engine Tests (Phase 4)', () => {
  it('detects critical player HP (< 25%) and recommends safe exploration with softened damage', () => {
    const character = {
      name: 'Injured Hero',
      hp: 5,
      maxHp: 30
    };
    const session = { turnCount: 3 };

    const pacing = aiDirectorEngine.evaluatePacing({ character, session });

    assert.strictEqual(pacing.tensionLevel, 'high');
    assert.ok(pacing.dangerScore >= 70, 'Danger score must reflect high tension');
    assert.strictEqual(pacing.recommendedPacing, 'offer_rest_or_safe_exploration');
    assert.strictEqual(pacing.adaptiveModifiers.enemyDamageModifier, 0.85);
  });

  it('detects player dominance (HP > 90% sustained over turns) and escalates threats', () => {
    const character = {
      name: 'Dominant Hero',
      hp: 29,
      maxHp: 30
    };
    const session = { turnCount: 5 };

    const pacing = aiDirectorEngine.evaluatePacing({ character, session });

    assert.strictEqual(pacing.tensionLevel, 'escalating');
    assert.strictEqual(pacing.recommendedPacing, 'escalate_threat_or_ambush');
    assert.strictEqual(pacing.adaptiveModifiers.enemyDamageModifier, 1.15);
    assert.strictEqual(pacing.adaptiveModifiers.triggerHazard, true);
  });

  it('maintains balanced tempo when player HP is in moderate range', () => {
    const character = {
      name: 'Steady Hero',
      hp: 20,
      maxHp: 30
    };
    const session = { turnCount: 2 };

    const pacing = aiDirectorEngine.evaluatePacing({ character, session });

    assert.strictEqual(pacing.tensionLevel, 'moderate');
    assert.strictEqual(pacing.recommendedPacing, 'maintain_tempo');
    assert.strictEqual(pacing.adaptiveModifiers.enemyDamageModifier, 1.0);
  });
});
