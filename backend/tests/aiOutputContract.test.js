const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parseSceneJson, validateScene, normalizeSceneData } = require('../src/services/narrative/sceneSchema');

describe('AI Output Contract Tests (Stage 3)', () => {
  it('1. Valid AI scene JSON parses and normalizes into strict canonical scene', () => {
    const validJson = JSON.stringify({
      chapterTitle: 'Babak II: Jejak Rahasia',
      location: 'Kedai Whispering Tavern',
      backgroundId: 'bg_01_tavern',
      speaker: 'Eldrin sang Barkeep',
      characterId: 'char_npc_01_barkeep',
      mood: 'tense',
      dialogue: 'Eldrin menatapmu lekat-lekat dan memperingatkan bahaya di luar pintu kedai.',
      consequenceNote: 'Informasi berharga berhasil didapatkan.',
      stateUpdates: {
        hpChange: -5,
        manaChange: 10,
        goldChange: 20,
        receivedItemId: 'item_01_potion_heal',
        consumedItemId: null,
        reputationChange: { tavern_guild: 5 },
        factDiscovered: 'Pintu belakang kedai terkunci rapat.'
      },
      missionLog: {
        title: 'Misi Rahasia Kedai',
        prologue: 'Sebuah ancaman mengintai di balik dinding kayu tua.',
        objective: 'Temukan kunci menuju ruang bawah tanah kedai.',
        status: 'active'
      },
      choices: [
        { id: 'c1', text: 'Periksa pintu belakang kedai', tone: 'cautious', actionType: 'INVESTIGATE' },
        { id: 'c2', text: 'Tanyakan Eldrin tentang jalan pintas', tone: 'diplomatic', actionType: 'TALK' }
      ]
    });

    const parsed = parseSceneJson(validJson);

    assert.strictEqual(parsed.chapterTitle, 'Babak II: Jejak Rahasia');
    assert.strictEqual(parsed.location, 'Kedai Whispering Tavern');
    assert.strictEqual(parsed.mood, 'tense');
    assert.strictEqual(parsed.stateUpdates.hpChange, -5);
    assert.strictEqual(parsed.stateUpdates.manaChange, 10);
    assert.strictEqual(parsed.stateUpdates.goldChange, 20);
    assert.strictEqual(parsed.stateUpdates.receivedItemId, 'item_01_potion_heal');
    assert.ok(parsed.stateUpdates.receivedItem, 'Received item must be resolved');
    assert.strictEqual(parsed.stateUpdates.receivedItem.id, 'item_01_potion_heal');
    assert.strictEqual(parsed.stateUpdates.factDiscovered, 'Pintu belakang kedai terkunci rapat.');
    assert.strictEqual(parsed.missionLog.objective, 'Temukan kunci menuju ruang bawah tanah kedai.');
    assert.strictEqual(parsed.choices.length, 2);
  });

  it('2. Missing optional fields receive safe canonical defaults', () => {
    const minimalJson = JSON.stringify({
      dialogue: 'Kamu melangkah perlahan ke dalam ruangan gelap gulita.',
      choices: [{ id: 'c1', text: 'Nyalakan obor', tone: 'cautious' }]
    });

    const parsed = parseSceneJson(minimalJson);

    assert.ok(parsed.chapterTitle);
    assert.ok(parsed.location);
    assert.strictEqual(parsed.mood, 'mysterious');
    assert.strictEqual(parsed.stateUpdates.hpChange, 0);
    assert.strictEqual(parsed.stateUpdates.manaChange, 0);
    assert.strictEqual(parsed.stateUpdates.goldChange, 0);
    assert.strictEqual(parsed.stateUpdates.receivedItemId, null);
    assert.strictEqual(parsed.stateUpdates.consumedItemId, null);
    assert.strictEqual(parsed.stateUpdates.factDiscovered, null);
    assert.deepStrictEqual(parsed.stateUpdates.reputationChange, {});
  });

  it('3. Non-numeric or invalid type stat changes are safely normalized to 0 without crash', () => {
    const invalidTypeJson = JSON.stringify({
      dialogue: 'Terjadi benturan keras di lorong bawah tanah.',
      choices: [{ id: 'c1', text: 'Bertahan', tone: 'cautious' }],
      stateUpdates: {
        hpChange: 'ten', // Invalid non-numeric string
        manaChange: null,
        goldChange: undefined
      }
    });

    const parsed = parseSceneJson(invalidTypeJson);

    assert.strictEqual(parsed.stateUpdates.hpChange, 0, 'Non-numeric string must be safely normalized to 0');
    assert.strictEqual(parsed.stateUpdates.manaChange, 0);
    assert.strictEqual(parsed.stateUpdates.goldChange, 0);
  });

  it('4. Invalid or hallucinated item IDs do not create fake items', () => {
    const fakeItemJson = JSON.stringify({
      dialogue: 'Kamu melihat benda aneh berkilauan di tanah.',
      choices: [{ id: 'c1', text: 'Amati benda itu', tone: 'cautious' }],
      stateUpdates: {
        receivedItemId: 'item_fake_nonexistent_99999'
      }
    });

    const parsed = parseSceneJson(fakeItemJson);

    assert.strictEqual(parsed.stateUpdates.receivedItem, null, 'Unregistered item ID must not resolve to an item');
    assert.strictEqual(parsed.stateUpdates.receivedItemId, null, 'Unregistered receivedItemId must be nullified');
  });

  it('5. Reputation change ignores invalid non-numeric structures', () => {
    const invalidRepJson = JSON.stringify({
      dialogue: 'Warga desa berbisik-bisik saat kamu lewat.',
      choices: [{ id: 'c1', text: 'Tersenyum sopan', tone: 'diplomatic' }],
      stateUpdates: {
        reputationChange: 'high' // Non-object invalid type
      }
    });

    const parsed = parseSceneJson(invalidRepJson);
    assert.deepStrictEqual(parsed.stateUpdates.reputationChange, {});
  });

  it('6. Empty or blank dialogue is rejected by validation', () => {
    assert.throws(() => {
      validateScene({
        chapterTitle: 'Babak Kosong',
        location: 'Kedai',
        dialogue: '   ', // Blank
        choices: [{ id: 'c1', text: 'Lanjut' }]
      });
    }, /dialogue cannot be empty/i);
  });

  it('7. Malformed AI responses (markdown wrappers, trailing text) are parsed cleanly or fail gracefully', () => {
    const wrappedInMarkdown = '```json\n{"dialogue": "Sebuah bisikan memecah keheningan malam.", "choices": [{"id": "c1", "text": "Dengarkan", "tone": "cautious"}]}\n```';
    const parsed = parseSceneJson(wrappedInMarkdown);
    assert.strictEqual(parsed.dialogue, 'Sebuah bisikan memecah keheningan malam.');

    assert.throws(() => {
      parseSceneJson('Ini bukan JSON sama sekali dan tidak ada payload');
    }, /JSON parse failed/i);
  });
});
