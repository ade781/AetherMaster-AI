const { GeminiClient, sanitizeLog } = require('../narrative/geminiClient');
const { customCampaignSchema } = require('../../utils/campaignSchemas');

class CampaignGeneratorService {
  constructor() {
    this.geminiClient = new GeminiClient();
  }

  getNodeCountForTier(tier = 'medium') {
    switch (String(tier).toLowerCase()) {
      case 'short':
        return 3;
      case 'long':
        return 15;
      case 'medium':
      default:
        return 7;
    }
  }

  generateDeterministicCampaign({
    theme = 'Gothic Dungeon',
    difficulty = 'normal',
    premise = 'Eksplorasi kastil terbengkalai penuh teka-teki kuno.',
    lengthTier = 'medium'
  }) {
    const nodeCount = this.getNodeCountForTier(lengthTier);
    const campaignId = `camp_custom_${Math.random().toString(36).substring(2, 9)}`;

    const presetEnemiesByDiff = {
      easy: [
        { name: 'Kelelawar Raksasa', hp: 14, ac: 11, attackBonus: 2, damage: '1d4+1', cr: 0.5 }
      ],
      normal: [
        { name: 'Gargoyle Penjaga', hp: 22, ac: 13, attackBonus: 4, damage: '1d6+2', cr: 1 },
        { name: 'Tengkorak Berzirah', hp: 18, ac: 12, attackBonus: 3, damage: '1d6+1', cr: 1 }
      ],
      hard: [
        { name: 'Ksatria Kutukan Kuno', hp: 45, ac: 16, attackBonus: 5, damage: '1d8+3', cr: 3 }
      ],
      deadly: [
        { name: 'Lich Bayangan Abadi', hp: 80, ac: 17, attackBonus: 7, damage: '2d8+4', cr: 5 }
      ]
    };

    const enemies = presetEnemiesByDiff[String(difficulty).toLowerCase()] || presetEnemiesByDiff.normal;

    const nodes = [];
    const titles = [
      'Gerbang Utama Terbengkalai',
      'Lorong Cermin Berbisik',
      'Perpustakaan Kuno Terkutuk',
      'Ruang Perangkap Labirin',
      'Sanctum Rahasia Bawah Tanah',
      'Jembatan Jurang Tanpa Dasar',
      'Ruang Takhta Terlupakan'
    ];

    for (let i = 0; i < nodeCount; i++) {
      const idx = i + 1;
      const title = titles[i] || `Babak ${idx}: Lorong Ke-${idx}`;
      const isStart = i === 0;
      const isBoss = i === nodeCount - 1;

      nodes.push({
        nodeId: isStart ? 'node_start' : `node_${idx}`,
        title,
        narrative: isStart
          ? `Pintu kayu lapuk berdiri di hadapan Anda. Angin dingin berhembus membawa aroma debu dan misteri ${theme}. ${premise}`
          : isBoss
            ? `Anda tiba di ujung eksplorasi. Aura kegelapan memuncak di ruang ini saat sosok penjaga utama bangkit menghadang langkah Anda!`
            : `Langkah Anda membawa Anda ke ${title}. Dinding batu tampak merekam jejak petualang terdahulu.`,
        location: isBoss ? 'Ruang Takhta Terlupakan' : 'Kastil Kuno',
        backgroundId: isBoss ? 'bg_03_boss' : 'bg_02_dungeon',
        choices: isBoss ? [
          { id: `c_${idx}_1`, label: 'Hunus senjata dan hadapi pertarungan puncak!', actionType: 'attack' },
          { id: `c_${idx}_2`, label: 'Gunakan artefak untuk menenangkan entitas', actionType: 'cast_spell' }
        ] : [
          { id: `c_${idx}_1`, label: 'Maju melangkah ke lorong depan dengan waspada', actionType: 'move' },
          { id: `c_${idx}_2`, label: 'Periksa celah dinding untuk mencari jalan rahasia', actionType: 'investigate' }
        ],
        combatEncounter: (isBoss || (i === 1 && difficulty !== 'easy')) ? {
          enemyName: enemies[0].name,
          hp: enemies[0].hp,
          ac: enemies[0].ac,
          attackBonus: enemies[0].attackBonus,
          damage: enemies[0].damage
        } : null
      });
    }

    const campaignData = {
      id: campaignId,
      title: `${theme}: Rahasia Yang Hilang`,
      premise,
      theme,
      difficulty,
      nodesCount: nodeCount,
      previewSummary: `Petualangan melintasi ${nodes[0].title} hingga ${nodes[nodes.length - 1].title}.`,
      nodes,
      presetEnemies: enemies
    };

    return customCampaignSchema.parse(campaignData);
  }

  async generateCampaign(params = {}) {
    const {
      theme = 'Gothic Dungeon',
      difficulty = 'normal',
      premise = 'Eksplorasi kastil terbengkalai penuh teka-teki kuno.',
      lengthTier = 'medium',
      dryRun = false,
      mock = false,
      forceFallback = false,
      liveApi = false
    } = params;

    const nodeCount = this.getNodeCountForTier(lengthTier);

    if (dryRun || mock || forceFallback || (process.env.NODE_ENV === 'test' && !liveApi) || !this.geminiClient.isAvailable()) {
      return this.generateDeterministicCampaign({ theme, difficulty, premise, lengthTier });
    }

    if (this.geminiClient.isAvailable()) {
      try {
        const systemPrompt = `You are an expert D&D 5E Campaign Designer. Create a cohesive custom campaign in Indonesian. Output strictly valid JSON matching:
{
  "id": "camp_custom_xxx",
  "title": "Campaign Title",
  "premise": "${premise}",
  "theme": "${theme}",
  "difficulty": "${difficulty}",
  "nodesCount": ${nodeCount},
  "previewSummary": "Short summary",
  "nodes": [
    {
      "nodeId": "node_start",
      "title": "Scene Title",
      "narrative": "Detailed narrative description in Indonesian",
      "location": "Location Name",
      "backgroundId": "bg_02_dungeon",
      "choices": [
        { "id": "c1", "label": "Action label", "actionType": "investigate" },
        { "id": "c2", "label": "Alternative action", "actionType": "strength_check" }
      ],
      "combatEncounter": null
    }
  ],
  "presetEnemies": [
    { "name": "Enemy Name", "hp": 22, "ac": 13, "attackBonus": 4, "damage": "1d6+2", "cr": 1 }
  ]
}`;

        const userPrompt = `Generate a complete ${lengthTier} campaign with exactly ${nodeCount} story nodes. Theme: "${theme}", Difficulty: "${difficulty}", Premise: "${premise}". Make choices meaningful and D&D 5E tactical.`;

        const responseText = await this.geminiClient.callWithRetry(userPrompt, systemPrompt, { timeoutMs: 8000 });
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(cleaned);
        return customCampaignSchema.parse(parsedJson);
      } catch (err) {
        console.warn(
          '[CampaignGeneratorService] Gemini generation failed, switching to deterministic campaign fallback:',
          sanitizeLog(err.message, this.geminiClient.apiKey)
        );
        return this.generateDeterministicCampaign({ theme, difficulty, premise, lengthTier });
      }
    }

    return this.generateDeterministicCampaign({ theme, difficulty, premise, lengthTier });
  }
}

module.exports = new CampaignGeneratorService();
