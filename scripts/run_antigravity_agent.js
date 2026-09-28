const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Load environment variables (supports production and local)
const envFile = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../backend/.env.production')
  : path.join(__dirname, '../backend/.env');
require('dotenv').config({ path: envFile });
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.production') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
  sequelize,
  Campaign,
  Location,
  NPC,
  Quest,
  QuestObjective
} = require('../backend/src/models');

const LOGS_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOGS_DIR, 'antigravity_agent.log');
const REPORT_MD = path.join(LOGS_DIR, 'latest_agent_report.md');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function writeLog(message) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${message}\n`;
  process.stdout.write(formatted);
  try {
    fs.appendFileSync(LOG_FILE, formatted, 'utf8');
  } catch (err) {
    console.error('Gagal menulis log:', err.message);
  }
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
  writeLog('❌ Error: GEMINI_API_KEY belum disetel di environment.');
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey });

// 13 Ragam Genre & Inspirasi Tematik Orisinal untuk Rotasi Kampanye (Anti-Klise Kutukan)
const THEMES = [
  { genre: 'celestial_astral', mood: 'Kepulauan melayang di atas awan, pelaut kapal udara skyship, navigasi rasi bintang, perburuan pecahan komet ajaib' },
  { genre: 'pirate_high_seas', mood: 'Pelayaran bahari di lautan badai, pulau karang tersembunyi, pasar penyelundup, armada bajak laut, legenda kraken laut dalam' },
  { genre: 'desert_ancient_ruins', mood: 'Gurun pasir keemasan, oase rempah karavan nomaden, piramida raja pasir purba terkubur, badai pasir pembelok waktu' },
  { genre: 'frost_expedition', mood: 'Puncak gunung salju abadi, benteng es ksatria musim dingin, ekspedisi binatang kutub mistis, aurora pembawa visi masa depan' },
  { genre: 'steampunk_inventor', mood: 'Kota mekanik uap berdenyut, brankas jam raksasa, automaton pekerja cerdas, pencurian cetak biru alkimia rahasia' },
  { genre: 'feywild_enchanted', mood: 'Hutan peri bercahaya magis, kanopi pohon raksasa, makhluk mitologi elven, kebun bunga waktu, teka-teki ratu fey' },
  { genre: 'court_intrigue', mood: 'Pesta topeng istana megah, diplomasi bayangan, konspirasi tahta kerajaan, pesta dansa bangsawan, detektif pemecah skandal' },
  { genre: 'dragon_conquest', mood: 'Kawah lahar gunung berapi, timbunan emas naga purba, klan penempa palu magma, turnamen ksatria penakluk wyvern' },
  { genre: 'subterranean_crystal', mood: 'Gua kristal permata raksasa, tambang kurcaci kuno, koloni jamur bercahaya bioluminescent, golem permata terlelap' },
  { genre: 'frontier_war_camp', mood: 'Benteng perbatasan hutan belantara, serikat pemburu bayaran, kemah perang klan terhormat, pertahanan pos terluar' },
  { genre: 'high_fantasy', mood: 'Menara akademi sihir astral, perpustakaan mantra purba, turnamen duel mantra penyihir, artefak pembuka gerbang dimensi' },
  { genre: 'eldritch_abyss', mood: 'Palung samudra purba yang misterius, kuil tenggelam atlantis, teka-teki teknologi peradaban bawah air yang hilang' },
  { genre: 'gothic_horror', mood: 'Kastil megah aristokrat malam, katedral terbengkalai berselimut kabut, misteri ordo pemburu perak' }
];

/**
 * 1. Generate Cerita & Kampanye Terstruktur menggunakan Antigravity Agent / Gemini
 */
async function generateStoryCampaign(theme) {
  if (!theme || !theme.genre) {
    theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  }
  writeLog(`📜 [World Architect] Merancang kampanye baru bertema: ${theme.genre} (${theme.mood})...`);

  const prompt = `Kamu adalah Antigravity World Architect untuk game RPG 'AetherMaster AI'.
Buat 1 Kampanye cerita baru yang lengkap, orisinal, kaya imajinasi, dan mendalam dalam bahasa Indonesia.
Tema: ${theme.genre} (${theme.mood}).

PANDUAN KREATIVITAS (SANGAT PENTING):
1. JANGAN membuat cerita klise yang hanya berkutat pada "kutukan darah", "arwah penasaran", atau "makam bangkit". Jadikan cerita terasa segar dan unik!
2. Bangun konflik cerita yang bervariasi sesuai tema:
   - Eksplorasi & Petualangan: memetakan wilayah baru, memperbaiki mesin/artefak purba, menyelamatkan kru kapal.
   - Detektif & Misteri: menyelidiki pencurian cetak biru ajaib, membongkar mata-mata faksi, memecahkan teka-teki kunci mekanik.
   - Diplomasi & Budaya: menengahi sengketa dua klan, memenangkan turnamen persahabatan, festival tahunan mistis.
   - Penyelamatan & Aksi: memburu binatang mitos langka, mempertahankan oase dari perampok gurun, ekspedisi ilmiah.
3. Karakter NPC harus hidup dan punya kepribadian khas (cth: insinyur eksentrik cerewet, kapten kapal berjiwa humoris, arkeolog antusias, diplomat bermata elang).
4. Buat dialog pembuka yang karismatik dan memikat pemain.

PENTING: Keluarkan HANYA JSON valid murni tanpa markdown triple backticks. Format JSON:
{
  "id": "slug_unik_huruf_kecil_underscore",
  "title": "Judul Kampanye Kreatif dan Epik",
  "premise": "Latar belakang narasi 2-3 kalimat yang memikat dan memicu petualangan.",
  "introDialogue": "Dialog pembuka 1-2 kalimat dari DM atau NPC yang menyapa petualang.",
  "genre": "${theme.genre}",
  "threatLevel": "Tier 1 (Level 1-3)" atau "Tier 2 (Level 3-5)",
  "recommendedClasses": ["warrior", "mage", "rogue"],
  "primarySkill": "Nama Skill Utama (cth: Persepsi & Investigasi / Alkimia / Negosiasi)",
  "icon": "Emoji Ikon (cth: ⚔️, 🧭, ⚙️, 🌊, 🦅, 📜)",
  "factions": ["Nama Faksi A", "Nama Faksi B"],
  "location": {
    "name": "Nama Lokasi Utama",
    "description": "Deskripsi atmosferik lokasi tempat petualangan dimulai.",
    "dangerLevel": 2
  },
  "npc": {
    "name": "Nama NPC Kunci",
    "role": "Navigator / Insinyur / Arkeolog / Diplomat / Barkeep",
    "dialogue": "Dialog khas NPC saat pertama kali ditemui."
  },
  "quest": {
    "title": "Nama Quest Utama",
    "description": "Tujuan utama pemain dalam quest ini.",
    "rewardExp": 120,
    "rewardGold": 45,
    "objectives": [
      {
        "description": "Langkah pertama (cth: Periksa peta navigasi atau selidiki instrumen)",
        "objectiveType": "INVESTIGATE",
        "requiredCount": 1
      },
      {
        "description": "Langkah kedua (cth: Buka ruang penyimpanan atau kumpulkan kristal daya)",
        "objectiveType": "EXPLORE",
        "requiredCount": 1
      },
      {
        "description": "Langkah ketiga (cth: Negosiasikan kesepakatan atau kalahkan pemimpin lawan)",
        "objectiveType": "DEFEAT",
        "requiredCount": 1
      }
    ]
  },
  "imagePrompt": "Detailed English prompt for cover art illustration of this scene (e.g. 'cinematic vibrant solarpunk airship flying over floating cloud islands, digital painting, artstation, 4k')"
}`;

  // 1. Prioritas Utama: Model Antigravity (Kategori Agents) via Google Interactions API (Kuota 100 RPD / 60 RPM)
  if (client.interactions && typeof client.interactions.create === 'function') {
    try {
      writeLog('• Mencoba Antigravity Agent model (antigravity-preview-latest) via Interactions API...');
      const response = await client.interactions.create({
        model: 'antigravity-preview-latest',
        input: prompt
      });
      const text = response.output_text;
      if (text) {
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        writeLog(`✓ [Antigravity Agent] Berhasil membuat kampanye: "${parsed.title}" (ID: ${parsed.id})`);
        return parsed;
      }
    } catch (err) {
      writeLog(`⚠️ Gagal pada model Antigravity Agent: ${err.message}`);
    }
  }

  // 2. Fallback ke Text-out Models standar
  const candidateModels = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite'
  ];

  for (const model of candidateModels) {
    try {
      writeLog(`• Mencoba narrative model: ${model}...`);
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        writeLog(`✓ Berhasil membuat kampanye: "${parsed.title}" (ID: ${parsed.id})`);
        return parsed;
      }
    } catch (err) {
      writeLog(`⚠️ Gagal pada model ${model}: ${err.message}`);
    }
  }

  throw new Error('Semua model Gemini gagal menghasilkan narasi kampanye.');
}

/**
 * 2. Generate Cover Image menggunakan Nano Banana Pro (dengan Fallback Cerdas)
 */
async function generateImageWithNanoBanana(imagePrompt, campaignId) {
  writeLog(`🎨 [Nano Banana Agent] Mengenerate cover art untuk prompt: "${imagePrompt.slice(0, 60)}..."`);

  // Opsi 1: Coba model Google Nano Banana Pro jika kuota tersedia
  try {
    writeLog('• Mengirim permintaan ke model: nano-banana-pro-preview...');
    const res = await client.models.generateContent({
      model: 'nano-banana-pro-preview',
      contents: `High quality fantasy RPG artwork, cover illustration: ${imagePrompt}`
    });

    const parts = res.candidates?.[0]?.content?.parts;
    for (const part of parts || []) {
      if (part.inlineData && part.inlineData.data) {
        writeLog('✓ Berhasil mendapatkan gambar dari Nano Banana Pro!');
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  } catch (err) {
    writeLog(`ℹ️ Nano Banana Pro cloud quota unavailable (${err.message}). Mengaktifkan fallback visual dinamis...`);
  }

  // Opsi 2: Fallback ke High-Res Dynamic Flux RPG Generator (Pollinations API - Free, No-Quota)
  try {
    const encodedPrompt = encodeURIComponent(`${imagePrompt}, epic fantasy concept art, highly detailed, dramatic lighting, 8k wallpaper`);
    const dynamicImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${Date.now()}`;
    writeLog(`✓ Menggunakan High-Res AI Artwork URL: ${dynamicImageUrl.slice(0, 80)}...`);
    return dynamicImageUrl;
  } catch (err) {
    writeLog(`⚠️ Gagal membuat URL dinamis: ${err.message}`);
  }

  // Opsi 3: Fallback ke curated asset lokal
  return `/assets/backgrounds/bg_01_tavern.png`;
}

/**
 * 3. Simpan Kampanye, Lokasi, NPC, dan Quest ke Database Cloud (Supabase / MySQL)
 */
async function saveToDatabase(storyData, coverImageUrl) {
  writeLog('💾 [Database Persister] Menyimpan konten dunia ke database cloud...');

  const uniqueSuffix = Date.now().toString(36).slice(-4);
  const campaignId = `${storyData.id.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_${uniqueSuffix}`;
  const locId = `loc_${campaignId}`;
  const npcId = `npc_${campaignId}`;
  const questId = `quest_${campaignId}`;

  // Kumpulan latar belakang berkualitas tinggi (29 background D&D) per genre
  const genreBgPools = {
    celestial_astral: [
      'bg_18_celestial_sanctum',
      'bg_08_arcane_library',
      'bg_24_feywild_glade'
    ],
    pirate_high_seas: [
      'bg_20_pirate_ship_deck',
      'bg_07_smuggler_cave',
      'bg_03_sunken_citadel',
      'bg_28_city_market_alley'
    ],
    desert_ancient_ruins: [
      'bg_17_desert_temple',
      'bg_10_ancient_ruins',
      'bg_28_city_market_alley'
    ],
    frost_expedition: [
      'bg_14_frost_peak',
      'bg_22_crystal_mines',
      'bg_10_ancient_ruins'
    ],
    steampunk_inventor: [
      'bg_26_clockwork_vault',
      'bg_06_alchemy_lab',
      'bg_28_city_market_alley',
      'bg_13_lava_forge'
    ],
    feywild_enchanted: [
      'bg_24_feywild_glade',
      'bg_08_arcane_library',
      'bg_18_celestial_sanctum'
    ],
    court_intrigue: [
      'bg_11_throne_room',
      'bg_08_arcane_library',
      'bg_28_city_market_alley'
    ],
    dragon_conquest: [
      'bg_09_dragon_crater',
      'bg_27_dragon_hoard',
      'bg_13_lava_forge'
    ],
    subterranean_crystal: [
      'bg_22_crystal_mines',
      'bg_12_underdark_cavern',
      'bg_13_lava_forge'
    ],
    frontier_war_camp: [
      'bg_21_goblin_war_camp',
      'bg_01_tavern',
      'bg_16_swamp_huts'
    ],
    high_fantasy: [
      'bg_08_arcane_library',
      'bg_18_celestial_sanctum',
      'bg_24_feywild_glade',
      'bg_27_dragon_hoard'
    ],
    eldritch_abyss: [
      'bg_03_sunken_citadel',
      'bg_29_abyssal_rift',
      'bg_07_smuggler_cave',
      'bg_12_underdark_cavern'
    ],
    gothic_horror: [
      'bg_05_vampire_castle',
      'bg_15_haunted_graveyard',
      'bg_25_abandoned_cathedral',
      'bg_04_crimson_crypt',
      'bg_19_shadowfell_citadel',
      'bg_23_dungeon_torture_chamber'
    ],
    // Alias kompatibilitas genre lama
    dark_fantasy: [
      'bg_01_tavern', 'bg_02_cursed_woods', 'bg_10_ancient_ruins', 'bg_16_swamp_huts'
    ],
    eldritch_mystery: [
      'bg_03_sunken_citadel', 'bg_29_abyssal_rift', 'bg_07_smuggler_cave'
    ],
    steampunk_fantasy: [
      'bg_26_clockwork_vault', 'bg_06_alchemy_lab', 'bg_28_city_market_alley'
    ],
    subterranean_survival: [
      'bg_12_underdark_cavern', 'bg_22_crystal_mines', 'bg_14_frost_peak'
    ]
  };

  const pool = genreBgPools[storyData.genre] || [
    'bg_01_tavern', 'bg_02_cursed_woods', 'bg_05_vampire_castle', 'bg_10_ancient_ruins', 'bg_15_haunted_graveyard'
  ];

  // Hitung penggunaan background di database agar selalu memilih yang paling sedikit dipakai (rotasi variatif)
  let resolvedBgId = pool[0];
  try {
    const existingCampaigns = await Campaign.findAll({ attributes: ['defaultBackgroundId'] });
    const usageCount = {};
    existingCampaigns.forEach(c => {
      if (c.defaultBackgroundId) {
        usageCount[c.defaultBackgroundId] = (usageCount[c.defaultBackgroundId] || 0) + 1;
      }
    });

    const sortedPool = [...pool].sort((a, b) => (usageCount[a] || 0) - (usageCount[b] || 0));
    const minCount = usageCount[sortedPool[0]] || 0;
    const leastUsed = sortedPool.filter(bg => (usageCount[bg] || 0) <= minCount);
    resolvedBgId = leastUsed[Math.floor(Math.random() * leastUsed.length)];
  } catch (e) {
    resolvedBgId = pool[Math.floor(Math.random() * pool.length)];
  }

  // Jika cover image tidak berupa data base64 (dari model AI langsung), gunakan background lokal terkurasi yang dijamin cepat dan tidak 500 error
  const finalCoverImage = (coverImageUrl && coverImageUrl.startsWith('data:'))
    ? coverImageUrl
    : `/assets/backgrounds/${resolvedBgId}.png`;

  // 1. Simpan Campaign
  const campaign = await Campaign.create({
    id: campaignId,
    title: storyData.title,
    premise: storyData.premise,
    introDialogue: storyData.introDialogue,
    genre: storyData.genre || 'dark_fantasy',
    threatLevel: storyData.threatLevel || 'Tier 1 (Level 1-3)',
    recommendedClasses: storyData.recommendedClasses || ['warrior', 'rogue', 'mage'],
    primarySkill: storyData.primarySkill || 'Persepsi & Investigasi',
    defaultBackgroundId: resolvedBgId,
    defaultNpcId: npcId,
    icon: storyData.icon || '⚔️',
    coverImage: finalCoverImage,
    factions: storyData.factions || ['Petualang Aether'],
    status: 'published'
  });

  // 2. Simpan Lokasi Utama
  const location = await Location.create({
    id: locId,
    campaignId: campaignId,
    name: storyData.location?.name || 'Area Terlarang',
    description: storyData.location?.description || storyData.premise,
    backgroundId: resolvedBgId,
    locationType: 'interior',
    metadata: {
      dangerLevel: storyData.location?.dangerLevel || 1,
      musicTheme: 'theme_ambient',
      ambientSfx: 'ambient_wind'
    }
  });

  // 3. Simpan NPC
  const npc = await NPC.create({
    id: npcId,
    campaignId: campaignId,
    name: storyData.npc?.name || 'Sosok Misterius',
    title: storyData.npc?.role || 'Questgiver',
    description: storyData.npc?.dialogue || storyData.introDialogue,
    personality: storyData.npc?.role || 'Misterius',
    background: storyData.premise,
    portraitId: 'char_npc_01_barkeep',
    defaultLocationId: locId
  });

  // 4. Simpan Quest & Objectives
  const quest = await Quest.create({
    id: questId,
    campaignId: campaignId,
    title: storyData.quest?.title || `Misteri ${storyData.title}`,
    description: storyData.quest?.description || storyData.premise,
    giverNpcId: npcId,
    rewardExp: storyData.quest?.rewardExp || 100,
    rewardGold: storyData.quest?.rewardGold || 50,
    rewardItems: ['item_01_potion_heal'],
    isMainQuest: true
  });

  if (Array.isArray(storyData.quest?.objectives)) {
    let seq = 1;
    for (const obj of storyData.quest.objectives) {
      await QuestObjective.create({
        id: `obj_${questId}_${seq}`,
        questId: questId,
        description: obj.description || 'Lanjutkan petualangan',
        objectiveType: obj.objectiveType || 'INVESTIGATE',
        targetId: locId,
        requiredCount: obj.requiredCount || 1,
        sequence: seq
      });
      seq++;
    }
  }

  writeLog(`✅ SUKSES BESAR: Kampanye "${campaign.title}" (${campaign.id}) aktif di database!`);
  return { campaign, location, npc, quest };
}

/**
 * 4. Siklus Penuh: Cerita + Gambar + Database + Laporan
 */
let cycleCount = 0;

async function executeCycle() {
  cycleCount++;
  const runTimestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  writeLog('===============================================================');
  writeLog(`     AETHERMASTER AI: ANTIGRAVITY WORLD ARCHITECT & NANO BANANA `);
  writeLog(`                      SIKLUS EKSEKUSI #${cycleCount}             `);
  writeLog(`                 WAKTU: ${runTimestamp}                         `);
  writeLog('===============================================================');

  const startTime = Date.now();

  try {
    // 1. Pilih tema cerita secara dinamis & seimbang dari database agar beragam dan tidak mengulang
    let chosenTheme;
    try {
      const existingCampaigns = await Campaign.findAll({ attributes: ['genre'] });
      const genreCounts = {};
      THEMES.forEach(t => { genreCounts[t.genre] = 0; });
      existingCampaigns.forEach(c => {
        if (c.genre && genreCounts[c.genre] !== undefined) {
          genreCounts[c.genre]++;
        }
      });

      const minCount = Math.min(...Object.values(genreCounts));
      const leastUsedThemes = THEMES.filter(t => (genreCounts[t.genre] || 0) <= minCount);
      chosenTheme = leastUsedThemes[Math.floor(Math.random() * leastUsedThemes.length)];
    } catch (e) {
      chosenTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    }

    // 2. Generate Cerita Kampanye
    const storyData = await generateStoryCampaign(chosenTheme);

    // 2. Generate Cover Image dengan Nano Banana Agent
    const coverImageUrl = await generateImageWithNanoBanana(storyData.imagePrompt, storyData.id);

    // 3. Simpan ke Database Cloud
    const result = await saveToDatabase(storyData, coverImageUrl);

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

    // 4. Buat Laporan Markdown untuk GitHub Actions Step Summary
    const mdContent = `# 🌌 Antigravity World Architect: Cerita Baru Dirilis!
**Waktu Eksekusi**: ${runTimestamp}  
**Durasi**: ${elapsedSec} detik | **Siklus**: #${cycleCount}  
**Status**: 🟢 Sukses tersimpan ke Database Cloud (Live di \`www.aethermaster.my.id\`)

---

### 🛡️ Detail Kampanye:
- **Judul**: **${result.campaign.title}** (\`${result.campaign.id}\`)
- **Genre**: \`${result.campaign.genre}\` | **Tingkat Ancaman**: \`${result.campaign.threatLevel}\`
- **Ikon**: ${result.campaign.icon} | **Skill Rekomendasi**: ${result.campaign.primarySkill}
- **Faksi Terkait**: ${result.campaign.factions.join(', ')}

### 📖 Latar Belakang & Premis:
> "${result.campaign.premise}"

### 💬 Dialog Pembuka:
> *${result.campaign.introDialogue}*

### 🗺️ Lokasi & NPC Kunci:
- **Lokasi**: **${result.location.name}** (\`${result.location.id}\`) — *${result.location.description}*
- **NPC**: **${storyData.npc?.name || result.npc.name}** (\`${storyData.npc?.role || result.npc.title || 'Questgiver'}\`) — "*${storyData.npc?.dialogue || result.npc.description}*"

### ⚔️ Quest Utama:
- **Judul Quest**: **${result.quest.title}**
- **Deskripsi**: ${result.quest.description}
- **Hadiah**: 💰 ${storyData.quest?.rewardGold || 50} Gold | 🌟 ${storyData.quest?.rewardExp || 100} EXP

### 🎨 Visual Art (Nano Banana Agent):
![Cover Art](${result.campaign.coverImage.startsWith('data:') ? 'https://image.pollinations.ai/prompt/fantasy_rpg_cover' : result.campaign.coverImage})

---
*Pemain dapat langsung memainkan kampanye ini sekarang di [AetherMaster AI](https://www.aethermaster.my.id).*
`;

    fs.writeFileSync(REPORT_MD, mdContent, 'utf8');
    writeLog(`📋 Laporan disimpan di: ${REPORT_MD}`);
    writeLog(`🎉 Siklus #${cycleCount} selesai dalam ${elapsedSec}s.\n`);

  } catch (error) {
    writeLog(`❌ Gagal pada siklus #${cycleCount}: ${error.message}`);
    if (error.stack) writeLog(error.stack);
  }
}

/**
 * 5. Runner Scheduler: Eksekusi Langsung atau Interval Loop 30 Menit
 */
async function start() {
  const args = process.argv.slice(2);
  let intervalMinutes = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--interval=')) {
      intervalMinutes = parseFloat(args[i].split('=')[1]);
    } else if (args[i] === '-i' || args[i] === '--interval') {
      intervalMinutes = parseFloat(args[i + 1]);
    } else if (args[i] === '--watch' || args[i] === '--loop') {
      intervalMinutes = 30; // default 30 menit
    }
  }

  // Jalankan siklus pertama
  await executeCycle();

  if (intervalMinutes && !isNaN(intervalMinutes) && intervalMinutes > 0) {
    const intervalMs = intervalMinutes * 60 * 1000;
    writeLog(`⏳ MODE BERKALA AKTIF: World Architect akan berjalan otomatis setiap ${intervalMinutes} menit.`);
    writeLog(`👉 Tekan Ctrl + C di terminal untuk menghentikan scheduler.\n`);

    setInterval(async () => {
      writeLog(`⏰ Memulai siklus berkala World Architect (${intervalMinutes} menit)...`);
      await executeCycle();
    }, intervalMs);
  } else {
    // Single execution (misal untuk GitHub Actions)
    process.exit(0);
  }
}

start();
