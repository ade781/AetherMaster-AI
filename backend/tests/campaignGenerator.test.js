const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const campaignGeneratorService = require('../src/services/campaign/campaignGeneratorService');
const { customCampaignSchema } = require('../src/utils/campaignSchemas');

describe('Campaign Generator Service & Schemas (Phase 3 & 5)', () => {
  it('generates a valid deterministic campaign matching Zod schema', () => {
    const campaign = campaignGeneratorService.generateDeterministicCampaign({
      theme: 'Gothic Horror',
      difficulty: 'hard',
      premise: 'Menyelidiki ruang bawah tanah katedral terkutuk.',
      lengthTier: 'medium'
    });

    assert.ok(campaign);
    assert.strictEqual(campaign.theme, 'Gothic Horror');
    assert.strictEqual(campaign.difficulty, 'hard');
    assert.strictEqual(campaign.nodesCount, 7);
    assert.ok(Array.isArray(campaign.nodes));
    assert.strictEqual(campaign.nodes.length, 7);
    assert.strictEqual(campaign.nodes[0].nodeId, 'node_start');
    assert.ok(campaign.nodes[0].choices.length >= 2);
    assert.ok(Array.isArray(campaign.presetEnemies));
    assert.ok(campaign.presetEnemies.length > 0);

    // Schema validation assertion
    const validated = customCampaignSchema.safeParse(campaign);
    assert.strictEqual(validated.success, true, 'Output must strictly satisfy customCampaignSchema');
  });

  it('respects length tiers (short: 3, medium: 7, long: 15)', () => {
    const shortCamp = campaignGeneratorService.generateDeterministicCampaign({ lengthTier: 'short' });
    assert.strictEqual(shortCamp.nodesCount, 3);
    assert.strictEqual(shortCamp.nodes.length, 3);

    const longCamp = campaignGeneratorService.generateDeterministicCampaign({ lengthTier: 'long' });
    assert.strictEqual(longCamp.nodesCount, 15);
    assert.strictEqual(longCamp.nodes.length, 15);
  });

  it('falls back seamlessly to deterministic campaign when generateCampaign is called', async () => {
    const campaign = await campaignGeneratorService.generateCampaign({
      theme: 'Forgotten Ruins',
      difficulty: 'normal',
      premise: 'Mencari relik kuno yang hilang.',
      lengthTier: 'short'
    });

    assert.ok(campaign);
    assert.strictEqual(campaign.theme, 'Forgotten Ruins');
    assert.strictEqual(campaign.nodesCount, 3);
    assert.ok(campaign.title.length > 0);
  });

  it('rejects invalid campaign data structures violating Zod schema', () => {
    const invalidData = {
      id: 'bad_campaign',
      title: '', // Empty title violates min(1)
      nodes: [] // Empty nodes violates min(1)
    };

    const result = customCampaignSchema.safeParse(invalidData);
    assert.strictEqual(result.success, false, 'Invalid schema data must be rejected');
  });
});
