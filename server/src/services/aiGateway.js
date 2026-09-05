// Modern Gemini AI Gateway powered by @google/genai SDK (Interactions API)
// Features gemini-3.8-flash with multi-model resilience and zero-crash offline simulation fallback
const { GoogleGenAI } = require('@google/genai');

const SYSTEM_PROMPT = `Kamu adalah "AetherMaster AI", seorang Dungeon Master (DM) profesional dan epik untuk tabletop RPG D&D 5th Edition.
Tugasmu:
1. Menarasikan petualangan fantasi dalam Bahasa Indonesia yang hidup, imersif, deskriptif, dan menegangkan.
2. Memandu alur cerita berdasarkan tindakan pemain dan hasil lemparan dadu D20.
3. Selalu format responmu dalam JSON valid dengan struktur:
{
  "narrative": "Teks narasi cerita lanjutan...",
  "requestedRoll": { "required": true, "type": "Perception / Athletics / Attack", "dc": 12, "reason": "Menghindar dari jebakan panah" }, // null jika tidak butuh lempar dadu
  "mutation": {
    "hpChange": -3, // negatif untuk damage, positif untuk heal, 0 jika tidak ada
    "goldChange": 10, // jumlah emas yang didapat/hilang
    "itemGained": null, // atau nama item string misal 'Kunci Besi Kuno'
    "itemLost": null
  },
  "suggestedChoices": [
    "Pilihan tindakan aksi 1",
    "Pilihan tindakan aksi 2",
    "Pilihan tindakan aksi 3"
  ]
}`;

// Candidate models for maximum reliability
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
];

// Helper to extract JSON from model output
function cleanAndParseJSON(rawText) {
  if (!rawText) return null;
  let text = rawText.trim();
  // Remove markdown code fences if model enclosed JSON in ```json ... ```
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  return JSON.parse(text);
}

exports.generateAdventureResponse = async ({ character, story, history, lastAction, rollResult, apiKey }) => {
  const activeKey = (apiKey && apiKey.trim() !== '') ? apiKey : process.env.GEMINI_API_KEY;

  if (activeKey && activeKey.trim() !== '') {
    const prompt = `Karakter Pemain: ${character.name} (Ras: ${character.race}, Kelas: ${character.characterClass}, Level: ${character.level}, HP: ${character.currentHp}/${character.maxHp}, AC: ${character.armorClass}).
Modul Cerita: ${story?.title || 'Petualangan Aetheria'} - ${story?.description || 'Eksplorasi alam fantasi'}
Riwayat Singkat: ${JSON.stringify((history || []).slice(-4))}
Aksi Terakhir Pemain: "${lastAction}"
Hasil Lemparan Dadu Terakhir: ${rollResult ? JSON.stringify(rollResult) : 'Tidak ada lemparan dadu'}.

Beri respon narasi lanjutan dalam format JSON yang ditentukan.`;

    const ai = new GoogleGenAI({ apiKey: activeKey });
    const uniqueModels = [...new Set(CANDIDATE_MODELS)];

    // Try candidate models in order of preference
    for (const model of uniqueModels) {
      try {
        const interaction = await ai.interactions.create({
          model,
          input: SYSTEM_PROMPT + '\n\n' + prompt,
          response_format: {
            type: 'text',
            mime_type: 'application/json',
          },
        });

        if (interaction && interaction.output_text) {
          const parsed = cleanAndParseJSON(interaction.output_text);
          if (parsed && parsed.narrative) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`[AI Gateway] Model ${model} encountered an issue (${err.message}). Trying fallback...`);
      }
    }
  }

  // Fallback: Intelligent Built-in D&D 5E Offline Narrator (Guaranteed No Error)
  return simulateOfflineDM({ character, story, lastAction, rollResult });
};

function simulateOfflineDM({ character, story, lastAction, rollResult }) {
  const act = (lastAction || '').toLowerCase();

  // If resolving a previous dice roll
  if (rollResult) {
    const isSuccess = rollResult.total >= (rollResult.dc || 12) || rollResult.isCrit;
    if (isSuccess) {
      return {
        narrative: `🎲 **Hasil Lemparan: ${rollResult.total} (BERHASIL!)**\n\nDengan kelincahan luar biasa dan insting terlatih, ${character.name} berhasil mengeksekusi aksinya dengan sempurna! Kamu berhasil mengatasi rintangan tersebut dan menemukan celah aman di depan. Dari balik reruntuhan, kamu menemukan sebuah peti perunggu kuno yang berisi koin emas berkilau!`,
        requestedRoll: null,
        mutation: {
          hpChange: 0,
          goldChange: 15,
          itemGained: 'Permata Safir Kecil',
          itemLost: null
        },
        suggestedChoices: [
          'Ambil permata dan periksa koridor berikutnya dengan waspada.',
          'Gunakan mantra pendeteksi sihir untuk memastikan tidak ada jebakan susulan.',
          'Istirahat sejenak untuk memulihkan nafas dan stamina.'
        ]
      };
    } else {
      const dmg = Math.floor(Math.random() * 4) + 2;
      return {
        narrative: `🎲 **Hasil Lemparan: ${rollResult.total} (GAGAL!)**\n\nGerakanmu sedikit terlambat! Mekanisme jebakan terpicu dan semburan gas beracun/anak panah melesat mengenai bahumu, menyebabkan **${dmg} Damage Luka**! Kamu berhasil mundur tepat waktu sebelum luka menjadi fatal. Suasana di sekitar kini semakin mencekam.`,
        requestedRoll: null,
        mutation: {
          hpChange: -dmg,
          goldChange: 0,
          itemGained: null,
          itemLost: null
        },
        suggestedChoices: [
          'Minum ramuan pemulih luka (Healing Potion) dari tas.',
          'Berlindung di balik pilar batu dan pasang kuda-kuda bertahan.',
          'Cari saklar manual di dinding untuk menonaktifkan jebakan.'
        ]
      };
    }
  }

  // General action triggers
  if (act.includes('obor') || act.includes('masuk') || act.includes('maju')) {
    return {
      narrative: `Langkah kakimu bergema di koridor batu yang dingin. Bau lumut basah menyengat hidungmu saat kobaran obor menyingkap sebuah aula besar berdinding pualam retak. Di tengah ruangan, sebuah peti batu sarkofagus dihiasi relief naga purba terkunci rapat. Tiba-tiba, kamu mendengar suara derit batu dari atas langit-langit!`,
      requestedRoll: { required: true, type: 'Perception Check', dc: 12, reason: 'Mendeteksi bahaya di atas langit-langit' },
      mutation: { hpChange: 0, goldChange: 0, itemGained: null, itemLost: null },
      suggestedChoices: [
        'Lempar dadu D20 untuk Perception Check (Waspada)',
        'Melompat menghindar ke samping secara membabi buta',
        'Angkat perisai ke atas kepala untuk menangkis serpihan batu'
      ]
    };
  }

  if (act.includes('serang') || act.includes('pedang') || act.includes('lawan') || act.includes('hantam')) {
    return {
      narrative: `Dengan tatapan tajam, ${character.name} menghunus senjata dan melancarkan serangan berani ke arah ancaman di hadapanmu! Angin berdesing saat bilah senjatamu membelah udara. Dungeon Master meminta lemparan Attack Roll untuk melihat apakah seranganmu menembus pertahanan musuh!`,
      requestedRoll: { required: true, type: 'Attack Roll', dc: 13, reason: 'Menembus armor musuh' },
      mutation: { hpChange: 0, goldChange: 0, itemGained: null, itemLost: null },
      suggestedChoices: [
        'Lempar dadu D20 untuk Attack Roll',
        'Kombinasikan dengan serangan sihir bonus',
        'Lakukan tipuan langkah (Feint attack)'
      ]
    };
  }

  // Default exploration narrative
  return {
    narrative: `Kamu mengambil tindakan dengan penuh kehati-hatian. Di sekelilingmu, aura sihir kuno terasa berdenyut lembut. Setiap langkah terasa menentukan arah takdir petualanganmu di ${story.startingLocation}. Apa keputusan berikutnya yang akan kamu ambil?`,
    requestedRoll: Math.random() > 0.6 ? { required: true, type: 'Wisdom / Insight Check', dc: 11, reason: 'Merasakan arah energi magis' } : null,
    mutation: { hpChange: 0, goldChange: 0, itemGained: null, itemLost: null },
    suggestedChoices: [
      'Periksa sudut ruangan untuk mencari pintu rahasia.',
      'Fokuskan indera untuk mendengar suara langkah musuh terdekat.',
      'Lanjutkan perjalanan menyusuri lorong utama.'
    ]
  };
}
