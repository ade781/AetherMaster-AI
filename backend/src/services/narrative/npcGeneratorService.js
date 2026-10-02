const { GeminiClient, sanitizeLog } = require('./geminiClient');
const { dynamicNpcSchema } = require('../../utils/campaignSchemas');
const NPCRepository = require('../../repositories/NPCRepository');

class NPCGeneratorService {
  constructor() {
    this.geminiClient = new GeminiClient();
  }

  generateDeterministicNPC({ role = 'merchant', alignment = 'neutral', context = '' }) {
    const roleLower = String(role).toLowerCase();

    const presets = {
      merchant: {
        name: 'Eldrin si Pengembara',
        race: 'Elf',
        greeting: 'Salam penjelajah, butuh perbekalan langka sebelum menjelajah lebih dalam?',
        personalityTraits: 'Waspada dan menyukai artefak kuno berkilau',
        inventory: [
          { itemId: 'item_01_potion_heal', name: 'Potion of Healing', price: 25 },
          { itemId: 'item_02_potion_mana', name: 'Mana Phial', price: 30 }
        ]
      },
      guard: {
        name: 'Kapten Roderick',
        race: 'Human',
        greeting: 'Berhenti! Sebutkan tujuanmu melintasi area terlarang ini.',
        personalityTraits: 'Tegas, berdedikasi tinggi, dan loyal pada ordo',
        inventory: [
          { itemId: 'item_03_iron_key', name: 'Kunci Besi Penjaga', price: 15 }
        ]
      },
      scholar: {
        name: 'Archivist Lysandra',
        race: 'Gnome',
        greeting: 'Ah, debu di tempat ini menyimpan sejarah yang teramat tua...',
        personalityTraits: 'Cerewet, penuh rasa ingin tahu, dan pelupa',
        inventory: [
          { itemId: 'item_scroll_teleport', name: 'Gulungan Kuno', price: 50 }
        ]
      },
      adventurer: {
        name: 'Gareth sang Pemburu',
        race: 'Half-Orc',
        greeting: 'Pedangku selalu siap untuk bahaya berikutnya.',
        personalityTraits: 'Pemberani, tidak sabaran, dan menyukai tantangan besar',
        inventory: [
          { itemId: 'item_01_potion_heal', name: 'Potion of Healing', price: 25 }
        ]
      }
    };

    const chosen = presets[roleLower] || presets.adventurer;
    const randomSuffix = Math.random().toString(36).substring(2, 6);

    return dynamicNpcSchema.parse({
      id: `npc_gen_${randomSuffix}`,
      name: chosen.name,
      race: chosen.race,
      role: roleLower,
      alignment,
      greeting: chosen.greeting,
      personalityTraits: chosen.personalityTraits,
      inventory: chosen.inventory
    });
  }

  async generateNPC(params = {}) {
    const {
      role = 'merchant',
      alignment = 'neutral',
      context = '',
      saveToDb = false,
      dryRun = false,
      mock = false,
      forceFallback = false,
      liveApi = false
    } = params;

    let npcData = null;

    if (dryRun || mock || forceFallback || (process.env.NODE_ENV === 'test' && !liveApi) || !this.geminiClient.isAvailable()) {
      npcData = this.generateDeterministicNPC({ role, alignment, context });
    } else {
      try {
        const systemPrompt = `You are an expert D&D 5E NPC designer. Output ONLY valid JSON matching this schema:
{
  "id": "npc_gen_xxx",
  "name": "NPC Name",
  "race": "Human / Elf / Dwarf / etc",
  "role": "${role}",
  "alignment": "${alignment}",
  "greeting": "In-character Indonesian greeting",
  "personalityTraits": "Distinct personality traits",
  "inventory": [
    { "itemId": "item_01_potion_heal", "name": "Potion of Healing", "price": 25 }
  ]
}`;

        const userPrompt = `Generate a dynamic NPC with role: "${role}", alignment: "${alignment}", context: "${context || 'Dungeon VTT'}". All spoken dialogue must be in Indonesian.`;

        const responseText = await this.geminiClient.callWithRetry(userPrompt, systemPrompt, { timeoutMs: 8000 });
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(cleaned);
        npcData = dynamicNpcSchema.parse(parsedJson);
      } catch (err) {
        console.warn(
          '[NPCGeneratorService] Gemini generation failed, switching to deterministic NPC generator:',
          sanitizeLog(err.message, this.geminiClient.apiKey)
        );
        npcData = this.generateDeterministicNPC({ role, alignment, context });
      }
    }

    if (saveToDb) {
      try {
        await NPCRepository.createNpc({
          id: npcData.id,
          name: npcData.name,
          role: npcData.role,
          greeting: npcData.greeting,
          dialogueRules: { personality: npcData.personalityTraits, alignment: npcData.alignment },
          inventory: npcData.inventory
        });
      } catch (e) {
        // Silently continue if DB insertion is not strictly required
      }
    }

    return npcData;
  }
}

module.exports = new NPCGeneratorService();
