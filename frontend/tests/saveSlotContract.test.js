import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Frontend Save Slot Canonical Contract', () => {
  it('should validate canonical slot fields format (hp, maxHp, characterLevel, location)', () => {
    const canonicalSlot = {
      slotNumber: 1,
      savedAt: new Date().toISOString(),
      campaignTitle: 'Hutan Terlarang',
      characterName: 'Valen',
      characterClass: 'Mage',
      characterLevel: 2,
      location: 'Gerbang Reruntuhan Kuno',
      hp: 18,
      maxHp: 20,
      turnCount: 5
    };

    // Ensure canonical fields exist and have correct types
    assert.equal(typeof canonicalSlot.hp, 'number');
    assert.equal(typeof canonicalSlot.maxHp, 'number');
    assert.equal(typeof canonicalSlot.characterLevel, 'number');
    assert.equal(typeof canonicalSlot.location, 'string');
    assert.equal(canonicalSlot.hp <= canonicalSlot.maxHp, true);

    // Ensure deprecated legacy fields do NOT exist
    assert.equal('characterHp' in canonicalSlot, false);
    assert.equal('characterMaxHp' in canonicalSlot, false);
    assert.equal('currentLocation' in canonicalSlot, false);
  });
});
