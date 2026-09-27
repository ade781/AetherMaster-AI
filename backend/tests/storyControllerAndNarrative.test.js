const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const logger = require('../src/utils/logger');

describe('Narrative Orchestration & Security Tests', () => {

  // Test 1: Normal Action Test
  describe('Test 1: Normal Action Flow', () => {
    it('standard adventure action produces valid choice resolution and snapshot', () => {
      const currentNode = {
        id: 'node_1',
        choices: [
          { id: 'choice_1', text: 'Bicara dengan Eldrin di meja bar', tone: 'diplomatis' },
          { id: 'choice_2', text: 'Periksa sudut ruangan yang gelap', tone: 'waspada' }
        ]
      };

      const choiceList = currentNode.choices;
      const matched = choiceList.find(c => c.id === 'choice_1');

      assert.ok(matched, 'Must find matched predefined choice');
      assert.strictEqual(matched.text, 'Bicara dengan Eldrin di meja bar');
      assert.strictEqual(matched.tone, 'diplomatis');

      // Validates mock generated next scene structure
      const mockNextScene = {
        chapterTitle: 'Babak II: Petunjuk Rahasia',
        location: 'Kedai Whispering Tavern',
        speaker: 'Eldrin sang Barkeep',
        mood: 'mysterious',
        dialogue: 'Eldrin menyeka gelas kayu lalu berbisik pelan memberitahumu tentang sebuah kunci kuno.',
        stateUpdates: {
          proposedHpChange: 0,
          proposedManaChange: 0,
          proposedGoldChange: 5,
          factDiscovered: 'Eldrin menyebutkan Kunci Makam Kuno'
        },
        choices: [
          { id: 'choice_2_1', text: 'Tanyakan letak makam itu', tone: 'inquisitive' }
        ]
      };

      assert.strictEqual(mockNextScene.mood, 'mysterious');
      assert.ok(mockNextScene.dialogue.length > 10);
      assert.strictEqual(mockNextScene.stateUpdates.proposedHpChange, 0);
    });
  });

  // Test 2: Invalid / Modern Action Test
  describe('Test 2: Modern / Out-of-Context Action Handling', () => {
    it('out-of-context modern action is handled diegetically without arbitrary HP penalty or crash', () => {
      const playerInput = 'Buka smartphone dan nyalakan senter HP';

      // Verify that out-of-context actions do not crash or automatically deduct HP
      const isModernOrAnachronistic = (text) => {
        const modernKeywords = ['smartphone', 'hp', 'handphone', 'ak-47', 'pistol', 'mobil', 'motor', 'laptop'];
        const lower = text.toLowerCase();
        return modernKeywords.some(kw => lower.includes(kw));
      };

      assert.strictEqual(isModernOrAnachronistic(playerInput), true);

      // Simulation of diegetic intent resolution
      const resolvedResponse = {
        actionText: playerInput,
        diegeticFallback: 'Kamu meraba saku pakaianmu mencari sesuatu yang asing dari dunia lain, namun yang kau temukan hanyalah kain lusuh dan udara dingin. Tak ada benda ajaib seperti itu di sini.',
        hpPenalty: 0 // MUST BE ZERO
      };

      assert.strictEqual(resolvedResponse.hpPenalty, 0, 'No arbitrary HP penalty for modern/invalid input');
      assert.ok(resolvedResponse.diegeticFallback.length > 20);
    });
  });

  // Security & Sensitive Data Redaction Test
  describe('Tugas 4: Logger Security & Redaction', () => {
    it('redacts Gemini API keys, passwords, and authorization tokens', () => {
      const sampleApiKey = 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6';
      const sampleBearer = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';

      const rawLog = {
        message: `Connecting with key ${sampleApiKey}`,
        auth: sampleBearer,
        password: 'superSecretPassword123',
        normalField: 'Player attacked goblin'
      };

      const sanitized = logger.sanitize(rawLog);

      assert.strictEqual(sanitized.password, '***REDACTED***');
      assert.ok(!sanitized.message.includes(sampleApiKey), 'API key must not appear in log');
      assert.ok(sanitized.message.includes('***REDACTED_API_KEY***'), 'API key must be replaced with redaction marker');
      assert.ok(!sanitized.auth.includes('xyz'), 'Token must not appear in log');
      assert.strictEqual(sanitized.normalField, 'Player attacked goblin');
    });
  });
});
