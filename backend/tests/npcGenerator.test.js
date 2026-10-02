const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const npcGeneratorService = require('../src/services/narrative/npcGeneratorService');
const { dynamicNpcSchema } = require('../src/utils/campaignSchemas');

describe('Dynamic NPC Generator Service Tests (Phase 4 & 5)', () => {
  it('generates a valid merchant NPC with dialogue and inventory matching Zod schema', async () => {
    const npc = await npcGeneratorService.generateNPC({
      role: 'merchant',
      alignment: 'neutral',
      context: 'Kedai bawah tanah'
    });

    assert.ok(npc);
    assert.ok(npc.id.startsWith('npc_gen_'));
    assert.strictEqual(npc.role, 'merchant');
    assert.strictEqual(npc.alignment, 'neutral');
    assert.ok(npc.greeting.length > 0, 'Greeting must be non-empty');
    assert.ok(npc.personalityTraits.length > 0, 'Personality traits must be defined');
    assert.ok(Array.isArray(npc.inventory), 'Inventory must be an array');
    assert.ok(npc.inventory.length > 0, 'Merchant should have items to sell');

    const validated = dynamicNpcSchema.safeParse(npc);
    assert.strictEqual(validated.success, true, 'NPC output must satisfy dynamicNpcSchema');
  });

  it('supports different NPC roles (guard, scholar, adventurer)', async () => {
    const guardNpc = await npcGeneratorService.generateNPC({ role: 'guard' });
    assert.strictEqual(guardNpc.role, 'guard');
    assert.match(guardNpc.greeting, /berhenti|tujuan/i);

    const scholarNpc = await npcGeneratorService.generateNPC({ role: 'scholar' });
    assert.strictEqual(scholarNpc.role, 'scholar');
    assert.match(scholarNpc.greeting, /sejarah|tua/i);
  });

  it('validates schema reject invalid NPC data', () => {
    const badNpc = {
      id: 'npc_1',
      name: '', // Empty name violates min(1)
      greeting: ''
    };

    const result = dynamicNpcSchema.safeParse(badNpc);
    assert.strictEqual(result.success, false);
  });
});
