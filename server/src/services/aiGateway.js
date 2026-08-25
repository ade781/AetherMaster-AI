// Free LLM Adapter (Google Gemini 1.5 Flash & Groq Llama 3) via Native Fetch
// Equipped with intelligent offline fallback DM simulation (Ponytail principle)

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

exports.generateAdventureResponse = async ({ character, story, history, lastAction, rollResult, apiKey }) => {
  // 1. If user provided Google Gemini API Key, call Gemini 1.5 Flash
  if (apiKey && apiKey.trim() !== '') {
    try {
      const prompt = `Karakter Pemain: ${character.name} (Ras: ${character.race}, Kelas: ${character.characterClass}, Level: ${character.level}, HP: ${character.currentHp}/${character.maxHp}, AC: ${character.armorClass}).
Modul Cerita: ${story.title} - ${story.description}
Riwayat Singkat: ${JSON.stringify(history.slice(-4))}
Aksi Terakhir Pemain: "${lastAction}"
Hasil Lemparan Dadu Terakhir: ${rollResult ? JSON.stringify(rollResult) : 'Tidak ada lemparan dadu'}.

Beri respon narasi lanjutan dalam format JSON yang ditentukan.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            }
          }),
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
        return parsed;
      }
    } catch (err) {
      console.warn('[AI Gateway] Gemini API call failed, falling back to built-in DM simulator:', err.message);
    }
  }

  // 2. Intelligent Built-in D&D 5E Offline Narrator (No API key required)
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
