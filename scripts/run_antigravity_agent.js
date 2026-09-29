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
  Quest
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
let client = null;
if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
  client = new GoogleGenAI({ apiKey });
} else {
  writeLog('⚠️ Warning: GEMINI_API_KEY belum disetel atau menggunakan nilai default. Fallback generator aktif.');
}

// Genre dan inspirasi tematik untuk rotasi kampanye
const THEMES = [
  { genre: 'dark_fantasy', mood: 'Kelam, misterius, reruntuhan kuno yang bangkit kembali', defaultBg: 'bg_02_cursed_woods' },
  { genre: 'gothic_horror', mood: 'Kastil berkabut, kutukan darah, arwah ksatria yang gelisah', defaultBg: 'bg_05_vampire_castle' },
  { genre: 'eldritch_mystery', mood: 'Kedalaman laut, artefak purba, bisikan entitas kosmik', defaultBg: 'bg_03_sunken_citadel' },
  { genre: 'high_fantasy', mood: 'Menara kristal, sihir astral, pertempuran ordo penyihir', defaultBg: 'bg_08_arcane_library' },
  { genre: 'steampunk_fantasy', mood: 'Kota mekanik uap, brankas kuno, serikat alkemis pemberontak', defaultBg: 'bg_26_clockwork_vault' },
  { genre: 'subterranean_survival', mood: 'Gua kristal Underdark, monster jamur berpendar, tambang kurcaci', defaultBg: 'bg_12_underdark_cavern' }
];

/**
 * Fallback Procedural Story Generator jika API Gemini Quota Habis / 503 Spike
 */
function generateFallbackCampaign(themeIndex) {
  const theme = THEMES[themeIndex % THEMES.length];
  const uniqueId = Date.now().toString(36).slice(-4);
  const titles = {
    dark_fantasy: ['Misteri Makam Terkutuk Morvath', 'Gema Kegelapan Lembah Sunyi', 'Bayang-Bayang Gerbang Kuno'],
    gothic_horror: ['Kutukan Darah di Kastil Bloodmere', 'Ratapan Ksatria Nisan Hitam', 'Malam Tanpa Fajar di Ravenhold'],
    eldritch_mystery: ['Bisikan Abisal Palung Sunken Citadel', 'Segel Kosmik Lautan Kegelapan', 'Artefak Kuno Sang Pengintai'],
    high_fantasy: ['Prahara Menara Permata Astral', 'Perang Sihir Ordo Bintang Ungu', 'Warisan Terlarang Perpustakaan Perak'],
    steampunk_fantasy: ['Sabotase Jam Besar Vault 7', 'Konspirasi Uap Brankas Obsidian', 'Revolusi Mekanik Guild Alkemis'],
    subterranean_survival: ['Gema Kristal Tambang Kegelapan', 'Misteri Spora Cahaya Underdark', 'Pelarian dari Labirin Karst']
  };
  const titleList = titles[theme.genre] || titles.dark_fantasy;
  const title = `${titleList[Math.floor(Math.random() * titleList.length)]} ${uniqueId.toUpperCase()}`;

  return {
    id: `${theme.genre}_${uniqueId}`,
    title,
    premise: `Sebuah bahaya kuno terbangun di wilayah ${theme.genre}. Kabut tebal dan firasat buruk melanda para penduduk, menuntut jiwa pemberani untuk menguak kebenaran sebelum kehancuran total.`,
    introDialogue: 'Berhati-hatilah, petualang. Tempat ini bukan untuk mereka yang gentar menghadapi bayang-bayang masa lalu.',
    genre: theme.genre,
    threatLevel: 'Tier 1 (Level 1-3)',
    recommendedClasses: ['warrior', 'rogue', 'mage'],
    primarySkill: 'Persepsi & Investigasi',
    icon: '🏰',
    factions: ['Petualang Aether', 'Penjaga Batas'],
    location: {
      name: `Kawasan ${title}`,
      description: `Wilayah berkabut pekat dengan reruntuhan batu tua dan aura mistis yang mengalir di udara.`,
      dangerLevel: 2
    },
    npc: {
      name: 'Penjaga Rahasia Kuno',
      role: 'Informant & Guide',
      dialogue: 'Bila kau ingin selamat dari tempat ini, dengarkan setiap desah angin dan jangan lengah.'
    },
    quest: {
      title: `Investigasi ${title}`,
      description: 'Selidiki fenomena ganjil, temukan petunjuk artefak, dan hentikan ancaman sebelum terlambat.',
      rewardExp: 120,
      rewardGold: 50,
      objectives: [
        { description: 'Periksa jejak misterius di gerbang reruntuhan', objectiveType: 'INVESTIGATE', requiredCount: 1 },
        { description: 'Kumpulkan fragmen segel perlindungan', objectiveType: 'EXPLORE', requiredCount: 1 },
        { description: 'Netralkan entitas penjaga kutukan', objectiveType: 'DEFEAT', requiredCount: 1 }
      ]
    },
    defaultBackgroundId: theme.defaultBg
  };
}

/**
 * 1. Generate Cerita & Kampanye Terstruktur menggunakan Gemini AI (dengan Procedural Fallback)
 */
async function generateStoryCampaign(themeIndex) {
  const theme = THEMES[themeIndex % THEMES.length];
  writeLog(`📢 [World Architect] Merancang kampanye baru bertema: ${theme.genre} (${theme.mood})...`);

  if (!client) {
    writeLog('ℹ️ Menggunakan fallback procedural generator (No API Client).');
    return generateFallbackCampaign(themeIndex);
  }

  const prompt = `Kamu adalah Antigravity World Architect untuk game RPG 'AetherMaster AI'.
Buat 1 Kampanye cerita baru yang lengkap, orisinal, dan mendalam dalam bahasa Indonesia.
Tema: ${theme.genre} (${theme.mood}).

PENTING: Keluarkan HANYA JSON valid murni tanpa markdown triple backticks. Format JSON:
{
  "id": "slug_unik_huruf_kecil_underscore",
  "title": "Judul Kampanye Epik",
  "premise": "Latar belakang narasi 2-3 kalimat yang memikat dan memicu krisis.",
  "introDialogue": "Dialog pembuka 1-2 kalimat dari DM atau NPC yang menyapa petualang.",
  "genre": "${theme.genre}",
  "threatLevel": "Tier 1 (Level 1-3)",
  "recommendedClasses": ["warrior", "mage", "rogue"],
  "primarySkill": "Nama Skill Utama (cth: Persepsi & Investigasi)",
  "icon": "🏰",
  "factions": ["Nama Faksi A", "Nama Faksi B"],
  "location": {
    "name": "Nama Lokasi Utama",
    "description": "Deskripsi atmosferik lokasi tempat petualangan dimulai.",
    "dangerLevel": 2
  },
  "npc": {
    "name": "Nama NPC Kunci",
    "role": "Questgiver / Informant / Barkeep / Hermit",
    "dialogue": "Dialog khas NPC saat pertama kali ditemui."
  },
  "quest": {
    "title": "Nama Quest Utama",
    "description": "Tujuan utama pemain dalam quest ini.",
    "rewardExp": 120,
    "rewardGold": 45,
    "objectives": [
      {
        "description": "Langkah pertama investigasi",
        "objectiveType": "INVESTIGATE",
        "requiredCount": 1
      },
      {
        "description": "Langkah kedua eksplorasi",
        "objectiveType": "EXPLORE",
        "requiredCount": 1
      },
      {
        "description": "Langkah ketiga pertarungan atau ritual",
        "objectiveType": "DEFEAT",
        "requiredCount": 1
      }
    ]
  },
  "imagePrompt": "Detailed English prompt for cover art illustration of this scene"
}`;

  const candidateModels = [
    process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
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
        writeLog(`✓ Berhasil membuat kampanye AI: "${parsed.title}" (ID: ${parsed.id})`);
        return parsed;
      }
    } catch (err) {
      writeLog(`⚠️ Gagal pada model ${model}: ${err.message}`);
    }
  }

  writeLog('ℹ️ Semua model AI sibuk/tidak tersedia, mengaktifkan Fallback Procedural Generator...');
  return generateFallbackCampaign(themeIndex);
}

/**
 * 2. Generate Cover Image (Nano Banana / Curated HD RPG Asset)
 * CATATAN PENTING: Jangan gunakan pollinations.ai karena mengembalikan HTTP 402 Payment Required!
 */
async function generateCoverImage(imagePrompt, genre, campaignId) {
  writeLog(`🎨 [Cover Art Generator] Menyiapkan cover art untuk genre: ${genre}...`);

  const bgMap = {
    dark_fantasy: 'bg_02_cursed_woods',
    gothic_horror: 'bg_05_vampire_castle',
    eldritch_mystery: 'bg_03_sunken_citadel',
    high_fantasy: 'bg_08_arcane_library',
    steampunk_fantasy: 'bg_26_clockwork_vault',
    subterranean_survival: 'bg_12_underdark_cavern'
  };
  const resolvedBgId = bgMap[genre] || 'bg_01_tavern';
  const localCuratedAsset = `/assets/backgrounds/${resolvedBgId}.png`;

  // Coba Nano Banana Pro jika tersedia
  if (client && imagePrompt) {
    try {
      writeLog('• Mengirim permintaan visual ke model nano-banana-pro-preview...');
      const res = await client.models.generateContent({
        model: 'nano-banana-pro-preview',
        contents: `High quality fantasy RPG artwork, cover illustration: ${imagePrompt}`
      });

      const parts = res.candidates?.[0]?.content?.parts;
      for (const part of parts || []) {
        if (part.inlineData && part.inlineData.data) {
          writeLog('✓ Berhasil mendapatkan gambar base64 dari Nano Banana Pro!');
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    } catch (err) {
      writeLog(`ℹ️ Nano Banana visual generator unavailable (${err.message}). Menggunakan Curated 4K RPG Asset...`);
    }
  }

  // Fallback selalu aman dan andal ke Curated 4K Background RPG Asset (0 Quota, 0 Error 402)
  writeLog(`✓ Menggunakan Curated High-Res Asset: ${localCuratedAsset}`);
  return localCuratedAsset;
}

/**
 * 3. Simpan Kampanye, Lokasi, NPC, dan Quest ke Database
 */
async function saveToDatabase(storyData, coverImageUrl) {
  writeLog('💾 [Database Persister] Menyimpan konten dunia ke database...');

  const uniqueSuffix = Date.now().toString(36).slice(-4);
  const campaignId = `${storyData.id.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_${uniqueSuffix}`;
  const locId = `loc_${campaignId}`;
  const npcId = `npc_${campaignId}`;
  const questId = `quest_${campaignId}`;

  const bgMap = {
    dark_fantasy: 'bg_02_cursed_woods',
    gothic_horror: 'bg_05_vampire_castle',
    eldritch_mystery: 'bg_03_sunken_citadel',
    high_fantasy: 'bg_08_arcane_library',
    steampunk_fantasy: 'bg_26_clockwork_vault',
    subterranean_survival: 'bg_12_underdark_cavern'
  };
  const resolvedBgId = storyData.defaultBackgroundId || bgMap[storyData.genre] || 'bg_01_tavern';

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
    icon: storyData.icon || '🏰',
    coverImage: coverImageUrl,
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

  // 4. Simpan Quest & Objectives (Disimpan di metadata Quest tanpa tabel QuestObjective)
  const quest = await Quest.create({
    id: questId,
    campaignId: campaignId,
    title: storyData.quest?.title || `Misteri ${storyData.title}`,
    description: storyData.quest?.description || storyData.premise,
    type: 'main',
    status: 'active',
    priority: 1,
    targetLocationId: locId,
    metadata: {
      rewardExp: storyData.quest?.rewardExp || 100,
      rewardGold: storyData.quest?.rewardGold || 50,
      rewardItems: ['item_01_potion_heal'],
      objectives: storyData.quest?.objectives || [
        { description: 'Lanjutkan petualangan', objectiveType: 'INVESTIGATE', requiredCount: 1 }
      ]
    }
  });

  writeLog(`✅ SUKSES BESAR: Kampanye "${campaign.title}" (${campaign.id}) aktif di database!`);
  return { campaign, location, npc, quest };
}

/**
 * 4. Eksekusi Siklus Utama World Architect
 */
async function runWorldArchitectCycle(themeIndex = 0) {
  const startTime = Date.now();
  writeLog(`\n======================================================`);
  writeLog(`🌌 Antigravity World Architect: Siklus Baru Dimulai`);
  writeLog(`======================================================`);

  try {
    await sequelize.authenticate();
    writeLog('✓ Terhubung ke database dengan sukses.');

    // 1. Buat Cerita Kampanye
    const storyData = await generateStoryCampaign(themeIndex);

    // 2. Buat Visual Cover Art (Aman dari 402 Error)
    const coverImage = await generateCoverImage(storyData.imagePrompt, storyData.genre, storyData.id);

    // 3. Simpan ke Database
    const result = await saveToDatabase(storyData, coverImage);

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

    // 4. Buat Markdown Report
    const mdContent = `# 🌌 Laporan Rilis Kampanye Baru: ${result.campaign.title}

- **ID Kampanye**: \`${result.campaign.id}\`
- **Genre**: **${result.campaign.genre}** | **Tingkat Ancaman**: ${result.campaign.threatLevel}
- **Latar Premis**: ${result.campaign.premise}
- **Waktu Pembuatan**: ${new Date().toISOString()} (${elapsedSec} detik)

### 🗺️ Lokasi & NPC Kunci:
- **Lokasi**: **${result.location.name}** (\`${result.location.id}\`) — *${result.location.description}*
- **NPC**: **${result.npc.name}** (\`${result.npc.role || result.npc.title}\`) — "*${result.npc.description}*"

### ⚔️ Quest Utama:
- **Judul Quest**: **${result.quest.title}**
- **Deskripsi**: ${result.quest.description}
- **Hadiah**: 💰 ${result.quest.metadata?.rewardGold || 50} Gold | 🌟 ${result.quest.metadata?.rewardExp || 100} EXP

### 🎨 Visual Cover Art:
- **Cover Image**: \`${result.campaign.coverImage.slice(0, 100)}...\`

---
*Pemain dapat langsung memainkan kampanye ini sekarang di AetherMaster AI.*
`;

    fs.writeFileSync(REPORT_MD, mdContent, 'utf8');
    writeLog(`📋 Laporan disimpan di: ${REPORT_MD}`);
    writeLog(`🎉 Siklus selesai dalam ${elapsedSec}s.\n`);

    return result;
  } catch (error) {
    writeLog(`❌ ERROR FATAL DALAM SIKLUS: ${error.message}\n${error.stack}`);
    throw error;
  }
}

// Jalankan jika dipanggil via CLI
if (require.main === module) {
  const themeIdx = Math.floor(Math.random() * THEMES.length);
  runWorldArchitectCycle(themeIdx)
    .then(() => {
      writeLog('✨ Eksekusi World Architect selesai secara normal.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}

module.exports = {
  runWorldArchitectCycle,
  generateStoryCampaign,
  generateCoverImage
};
