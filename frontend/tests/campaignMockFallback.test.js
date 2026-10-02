import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { campaignApi } from '../src/services/api.js';
import { mockGenerateCampaign } from '../src/services/campaignMockApi.js';

describe('Frontend Campaign API Mock Fallback Resilience', () => {
  it('should automatically fall back to mock campaign generation when network is offline', async () => {
    // When called in Node.js test environment without running backend, fetch will fail
    // and campaignApi must automatically resolve via mockGenerateCampaign
    const payload = {
      themeId: 'gothic-dungeon',
      difficultyId: 'hardcore',
      storyLength: 7,
      narrativePrompt: 'Menyelidiki reruntuhan makam bayangan.'
    };

    const res = await campaignApi.generateCampaign(payload);

    assert.ok(res, 'Response harus ada');
    assert.equal(res.success, true, 'Response status harus success: true');
    assert.ok(res.data, 'Data campaign harus ada');

    const camp = res.data;
    assert.ok(camp.id.startsWith('custom_campaign_'), 'ID campaign harus berformat custom_campaign_*');
    assert.equal(camp.themeId, 'gothic-dungeon');
    assert.equal(camp.difficultyId, 'hardcore');
    assert.equal(camp.crModifier, 2, 'Hardcore CR modifier harus 2');
    assert.equal(camp.storyLength, 7, 'Story length harus 7');
    assert.ok(camp.nodes.length === 7, 'Nodes array harus berjumlah 7');
    assert.ok(camp.npcs.length >= 2, 'Minimal 2 NPC harus dihasilkan');
    assert.ok(camp.enemies.length >= 2, 'Minimal 2 musuh harus dihasilkan');
  });

  it('should guarantee canonical contract fields on generated procedural campaign', async () => {
    const res = await mockGenerateCampaign({
      themeId: 'sunken-citadel',
      difficultyId: 'deadly',
      storyLength: 3,
      narrativePrompt: 'Kuil samudra kuno terendam.'
    });

    assert.equal(res.success, true);
    const data = res.data;

    // Required campaign top-level fields
    const requiredCampaignFields = [
      'id',
      'title',
      'description',
      'themeId',
      'themeName',
      'difficultyId',
      'difficultyName',
      'crModifier',
      'storyLength',
      'coverImage',
      'createdAt',
      'npcs',
      'enemies',
      'initialNode',
      'nodes'
    ];

    for (const field of requiredCampaignFields) {
      assert.ok(field in data, `Field ${field} harus ada dalam data campaign`);
    }

    // Validate Enemy specs
    const boss = data.enemies[data.enemies.length - 1];
    assert.ok(boss.hp > 0, 'HP musuh harus > 0');
    assert.ok(boss.ac >= 10, 'AC musuh harus valid D&D 5E');
    assert.ok(boss.cr >= 1, 'CR musuh harus valid D&D 5E');
    assert.ok(Array.isArray(boss.abilities) && boss.abilities.length > 0, 'Musuh harus memiliki abilities');

    // Validate Node specs
    for (const node of data.nodes) {
      assert.ok(node.id, 'Node harus memiliki ID');
      assert.ok(node.chapterTitle, 'Node harus memiliki chapterTitle');
      assert.ok(node.dialogueText, 'Node harus memiliki dialogueText');
      assert.ok(node.backgroundId, 'Node harus memiliki backgroundId');
    }
  });

  it('should generate dynamic NPC with valid voiceConfig for procedural synth', async () => {
    const res = await campaignApi.generateDynamicNpc({ role: 'Ally', race: 'Elf' });

    assert.ok(res, 'NPC result harus ada');
    assert.equal(res.role, 'Ally');
    assert.equal(res.race, 'Elf');
    assert.ok(typeof res.voiceConfig === 'object', 'voiceConfig harus object');
    assert.ok(typeof res.voiceConfig.pitch === 'number', 'pitch harus number');
    assert.ok(typeof res.voiceConfig.rate === 'number', 'rate harus number');
    assert.ok(typeof res.greetingQuote === 'string', 'greetingQuote harus string');
  });
});
