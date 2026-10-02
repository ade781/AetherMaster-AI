import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_THEMES, DIFFICULTY_PRESETS, mockGenerateDynamicNpc } from '../src/services/campaignMockApi.js';

describe('Frontend Campaign Builder Wizard Invariants & Validations', () => {
  it('should validate all preset themes contain required visual and narrative metadata', () => {
    assert.ok(PRESET_THEMES.length >= 4, 'Minimal 4 tema harus tersedia');

    for (const theme of PRESET_THEMES) {
      assert.ok(typeof theme.id === 'string' && theme.id.length > 0, 'Theme ID harus string');
      assert.ok(typeof theme.name === 'string' && theme.name.length > 0, 'Theme name harus string');
      assert.ok(typeof theme.tagline === 'string', 'Theme tagline harus ada');
      assert.ok(typeof theme.bgId === 'string', 'Theme bgId harus ada');
      assert.ok(Array.isArray(theme.suggestedEnemies) && theme.suggestedEnemies.length > 0, 'Suggested enemies harus array non-kosong');
    }
  });

  it('should calculate difficulty CR modifiers and HP multipliers correctly', () => {
    const easy = DIFFICULTY_PRESETS.find(d => d.id === 'easy');
    const balanced = DIFFICULTY_PRESETS.find(d => d.id === 'balanced');
    const hardcore = DIFFICULTY_PRESETS.find(d => d.id === 'hardcore');
    const deadly = DIFFICULTY_PRESETS.find(d => d.id === 'deadly');

    assert.ok(easy && balanced && hardcore && deadly, 'Semua tingkat kesulitan harus terdefinisi');

    assert.equal(easy.crModifier, -1, 'Easy harus -1 CR modifier');
    assert.equal(balanced.crModifier, 0, 'Balanced harus 0 CR modifier');
    assert.equal(hardcore.crModifier, 2, 'Hardcore harus +2 CR modifier');
    assert.equal(deadly.crModifier, 4, 'Deadly harus +4 CR modifier');

    assert.ok(easy.enemyHpMultiplier < balanced.enemyHpMultiplier, 'HP multiplier Easy harus lebih rendah dari Balanced');
    assert.ok(hardcore.enemyHpMultiplier > balanced.enemyHpMultiplier, 'HP multiplier Hardcore harus lebih tinggi dari Balanced');
  });

  it('should sanitize and format premise narrative prompts', () => {
    const sanitizePremise = (input, maxLength = 300) => {
      if (!input || typeof input !== 'string') {
        return 'Petualangan fantasi misterius di dunia AetherMaster.';
      }
      const stripped = input.replace(/<[^>]*>/g, '').trim();
      return stripped.slice(0, maxLength);
    };

    const empty = sanitizePremise('');
    assert.equal(empty, 'Petualangan fantasi misterius di dunia AetherMaster.');

    const htmlInjected = sanitizePremise('<script>alert("hack")</script>Menyelidiki reruntuhan kuno.');
    assert.equal(htmlInjected, 'alert("hack")Menyelidiki reruntuhan kuno.');
    assert.equal(htmlInjected.includes('<script>'), false);

    const longText = 'A'.repeat(500);
    const sanitizedLong = sanitizePremise(longText);
    assert.equal(sanitizedLong.length, 300, 'Teks premis harus dipotong maksimal 300 karakter');
  });

  it('should generate valid procedural dynamic NPC profiles with voice configs', () => {
    const npc = mockGenerateDynamicNpc({ role: 'Merchant', race: 'Dwarf' });

    assert.ok(npc.id.startsWith('npc_'), 'ID NPC harus berformat npc_*');
    assert.ok(npc.name.length > 0, 'Nama NPC harus ada');
    assert.equal(npc.role, 'Merchant');
    assert.equal(npc.race, 'Dwarf');
    assert.ok(typeof npc.greetingQuote === 'string' && npc.greetingQuote.length > 0, 'Kutipan sapaan harus ada');
    assert.ok(typeof npc.voiceConfig === 'object', 'Voice config harus ada');
    assert.ok(npc.voiceConfig.pitch <= 0.7, 'Dwarf harus memiliki pitch suara rendah/berat');
    assert.ok(npc.stats.hp >= 10, 'HP NPC harus valid');
    assert.ok(npc.stats.ac >= 10, 'AC NPC harus valid');
  });
});
