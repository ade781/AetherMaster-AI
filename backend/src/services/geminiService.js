const { GoogleGenAI } = require('@google/genai');
const { z } = require('zod');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const choiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  requiredItem: z.string().nullable().optional(),
  tone: z.string().optional()
});

const sceneSchema = z.object({
  chapterTitle: z.string().default('Babak Petualangan'),
  location: z.string().default('Kedai Whispering Tavern'),
  backgroundId: z.string().default('bg_01_tavern'),
  speaker: z.string().default('Eldrin sang Barkeep'),
  characterId: z.string().default('char_npc_01_barkeep'),
  mood: z.enum(['tense', 'mysterious', 'triumphant', 'ominous', 'peaceful']).default('mysterious'),
  dialogue: z.string(),
  consequenceNote: z.string().nullable().optional(),
  stateUpdates: z.object({
    hpChange: z.number().default(0),
    goldChange: z.number().default(0),
    receivedItem: z.any().nullable().optional(),
    consumedItem: z.any().nullable().optional(),
    addLedgerFact: z.string().nullable().optional()
  }).default({
    hpChange: 0,
    goldChange: 0,
    receivedItem: null,
    consumedItem: null,
    addLedgerFact: null
  }),
  choices: z.array(choiceSchema).default([]),
  combatEncounter: z.any().nullable().optional()
});

// Helper to remove any em dashes if LLM slips one in
function cleanText(text) {
  if (!text) return '';
  return text.replace(/—/g, ', ');
}

// Fallback Deterministic Scene Generator
function getFallbackOpening(campaign, character) {
  const charName = character?.name || 'Petualang';
  const charClass = character?.characterClass || 'Warrior';

  if (campaign?.id === 'crypt_of_crimson') {
    return {
      chapterTitle: 'Babak I: Gerbang Makam Merah Darah',
      location: 'Koridor Bawah Tanah Makam Merah',
      backgroundId: 'bg_04_crimson_crypt',
      speaker: 'Informan Bayangan',
      characterId: 'char_npc_02_informant',
      mood: 'ominous',
      dialogue: `Lilin merah menyala di sepanjang dinding batu bertabur tengkorak. Hawa dingin merayap di kulitmu, ${charName}. Informan bertudung menoleh padamu dan berbisik pelan, memperingatkan bahwa Malakor si Necromancer telah membuka segel peti mati terlarang.`,
      consequenceNote: 'Kamu berhasil menyusup ke makam bawah tanah tanpa menarik perhatian pengawal luar.',
      stateUpdates: {
        hpChange: 0,
        goldChange: 0,
        receivedItem: {
          id: 'item_06_skeleton_key',
          name: 'Kunci Tengkorak Kuno',
          category: 'Kunci',
          effect: 'Dapat membuka gembok makam bawah tanah',
          icon: 'item_06_skeleton_key'
        },
        consumedItem: null,
        addLedgerFact: 'Menyusup ke Makam Merah bersama Informan Bayangan.'
      },
      choices: [
        {
          id: 'c1',
          text: 'Periksa dinding batu bertuliskan mantra pemanggil arwah',
          tone: 'curious'
        },
        {
          id: 'c2',
          text: 'Mengendap maju menembus koridor gelap tanpa suara rantai bergemerincing',
          tone: 'cautious'
        },
        {
          id: 'c3',
          text: 'Dobrak pintu besi berlambang segel darah dengan sekuat tenaga',
          tone: 'bold'
        }
      ]
    };
  }

  if (campaign?.id === 'abyssal_citadel') {
    return {
      chapterTitle: 'Babak I: Reruntuhan yang Tenggelam',
      location: 'Kuil Abyssal Sunken Citadel',
      backgroundId: 'bg_03_sunken_citadel',
      speaker: 'Silus sang Pemuja Samudra',
      characterId: 'char_npc_08_cultist',
      mood: 'mysterious',
      dialogue: `Gelembung udara mengambang lambat di antara pilar batu berkepala gurita. Cahaya biru toska berpendar dari anemon laut di kakimu. Silus menatapmu dengan mata berkilat aneh, menyambut kedatanganmu di makam sang dewa laut.`,
      consequenceNote: 'Kamu menghirup aether pelindung pernapasan bawah air.',
      stateUpdates: {
        hpChange: 0,
        goldChange: 0,
        receivedItem: {
          id: 'item_07_golden_compass',
          name: 'Kompas Bintang Emas',
          category: 'Relik',
          effect: '+2 Bonus WIS saat menentukan arah',
          icon: 'item_07_golden_compass'
        },
        consumedItem: null,
        addLedgerFact: 'Tiba di Kuil Sunken Citadel dengan restu kompas bintang.'
      },
      choices: [
        {
          id: 'c1',
          text: 'Tafsirkan ukiran kuno persembahan dewa samudra pada prasasti altar',
          tone: 'cautious'
        },
        {
          id: 'c2',
          text: 'Berenang menyelinap di balik reruntuhan pilar menjauhi penjaga gurita',
          tone: 'cautious'
        },
        {
          id: 'c3',
          text: 'Intimidasi Silus agar menyerahkan mutiara pelindung tanpa teka-teki',
          tone: 'bold'
        }
      ]
    };
  }

  // Default: Whispering Tavern
  return {
    chapterTitle: 'Babak I: Nyala Lilin di Kedai Kuno',
    location: 'Kedai Whispering Tavern',
    backgroundId: 'bg_01_tavern',
    speaker: 'Eldrin sang Barkeep',
    characterId: 'char_npc_01_barkeep',
    mood: 'mysterious',
    dialogue: `Hujan deras menghantam jendela kedai berkaca patri. Di dekat perapian bata yang hangat, Eldrin meletakkan cangkir ale berbusa tebal di hadapanmu. Matanya melirik ke arah pintu ruang bawah tanah yang digembok rapat, memberi isyarat bahwa malam ini ada rahasia gelap yang menuntut keberanianmu.`,
    consequenceNote: 'Kamu tiba di kedai saat badai melanda kota.',
    stateUpdates: {
      hpChange: 0,
      goldChange: 15,
      receivedItem: {
        id: 'item_01_potion_heal',
        name: 'Ramuan Penyembuh Darah',
        category: 'Obat',
        effect: 'Memulihkan 25 Hit Points seketika',
        icon: 'item_01_potion_heal'
      },
      consumedItem: null,
      addLedgerFact: 'Bertemu Eldrin di Whispering Tavern saat badai.'
    },
    choices: [
      {
        id: 'c1',
        text: 'Tanyakan asal mula ketukan aneh dari pintu ruang bawah tanah kedai',
        tone: 'shrewd'
      },
      {
        id: 'c2',
        text: 'Amati gerak-gerik tamu mencurigakan di sudut remang kedai',
        tone: 'cautious'
      },
      {
        id: 'c3',
        text: 'Tenggak habis ale lalu tawarkan jasamu menumpas ancaman bawah tanah',
        tone: 'bold'
      }
    ]
  };
}

function getFallbackNextScene(previousNode, choice, checkResult, character, turnCount) {
  const isSuccess = checkResult?.isSuccess;
  const isNat20 = checkResult?.isNat20;
  const isNat1 = checkResult?.isNat1;

  // Branching narrative based on turn and success
  if (turnCount >= 3 && !previousNode.combatEncounter) {
    // Trigger combat encounter!
    return {
      chapterTitle: 'Babak Pertarungan: Teror di Balik Pintu Rahasia',
      location: 'Ruang Bawah Tanah Kedai Kuno',
      backgroundId: 'bg_04_crimson_crypt',
      speaker: 'Prajurit Tengkorak Terkutuk',
      characterId: 'monster_01_skeleton',
      mood: 'tense',
      dialogue: cleanText(
        isSuccess
          ? `Tindakanmu berhasil membongkar pintu rahasia! Namun debu yang berhamburan disusul oleh derak tulang bergeretak. Sesosok Prajurit Tengkorak bangkit dengan pedang berkarat siap menerkammu!`
          : `Gagal menjaga kesenyapan! Suara gaduh membangunkan penjaga kubur. Prajurit Tengkorak melompat dari kegelapan mengayunkan pedangnya ke arahmu!`
      ),
      consequenceNote: checkResult?.breakdown || 'Pertarungan tak terhindarkan.',
      stateUpdates: {
        hpChange: isSuccess ? 0 : -5,
        goldChange: 0,
        receivedItem: null,
        consumedItem: null,
        addLedgerFact: 'Menghadapi Prajurit Tengkorak di ruang bawah tanah.'
      },
      combatEncounter: {
        enemyName: 'Prajurit Tengkorak Terkutuk',
        enemyHp: 24,
        maxEnemyHp: 24,
        enemyAC: 12,
        enemyAttackBonus: 3,
        enemyDamageDice: 6,
        enemyDamageBonus: 1,
        sprite: 'monster_01_skeleton',
        rewardExp: 50,
        rewardGold: 20
      },
      choices: [
        {
          id: 'combat_attack',
          text: 'Tebas dengan ayunan senjata utama ke celah tulang rusuk lawan',
          tone: 'bold'
        },
        {
          id: 'combat_spell',
          text: 'Lepaskan semburan api Fireball untuk melumat sendi tengkorak',
          tone: 'bold'
        },
        {
          id: 'combat_flee',
          text: 'Gunakan perisai untuk menangkis lalu cari celah mundur taktis',
          tone: 'cautious'
        }
      ]
    };
  }

  // Regular progression
  const locations = [
    { title: 'Lorong Bawah Tanah', loc: 'Ruang Bawah Tanah Kuno', bg: 'bg_06_alchemy_lab', spk: 'Informan Bertudung', char: 'char_npc_02_informant', mood: 'mysterious' },
    { title: 'Pustaka Terlarang', loc: 'Arcane Library', bg: 'bg_08_arcane_library', spk: 'Arwah Penyihir Perak', char: 'char_hero_03_wizard', mood: 'tense' },
    { title: 'Singgasana Bayangan', loc: 'Ruang Takhta Kastil Vampir', bg: 'bg_05_vampire_castle', spk: 'Lord Valerius', char: 'char_npc_03_vampire', mood: 'ominous' }
  ];

  const locIdx = Math.min(locations.length - 1, Math.max(0, turnCount % locations.length));
  const chosenLoc = locations[locIdx];

  let outcomeText = '';
  let hpDelta = 0;
  let goldDelta = 0;

  if (isNat20) {
    outcomeText = `Keberuntungan agung berpihak padamu! Dengan ketangkasan luar biasa, rencanamu berhasil sempurna tanpa cela sedikit pun.`;
    goldDelta = 25;
  } else if (isSuccess) {
    outcomeText = `Usahamu membuahkan hasil nyata. Rintangan terlewati dan jalan di depanmu kini terbuka lebar.`;
    goldDelta = 10;
  } else if (isNat1) {
    outcomeText = `Malapetaka tak terduga terjadi! Gerakanmu meleset fatal dan kamu tersandung batu tajam hingga terluka.`;
    hpDelta = -8;
  } else {
    outcomeText = `Tindakanmu tidak sepenuhnya mulus, musuh menyadari keberadaanmu dan kamu harus menahan serpihan benturan.`;
    hpDelta = -4;
  }

  return {
    chapterTitle: `Babak ${turnCount + 1}: ${chosenLoc.title}`,
    location: chosenLoc.loc,
    backgroundId: chosenLoc.bg,
    speaker: chosenLoc.spk,
    characterId: chosenLoc.char,
    mood: chosenLoc.mood,
    dialogue: cleanText(`${outcomeText} Udara di sekitar bergetar dingin ketika ${chosenLoc.spk} menatap langkahmu. Bayangan di sudut ruangan perlahan memanjang, menandakan bahwa waktu kian sempit sebelum rahasia abadi ini terkuak.`),
    consequenceNote: checkResult?.breakdown || 'Langkah baru diambil.',
    stateUpdates: {
      hpChange: hpDelta,
      goldChange: goldDelta,
      receivedItem: (turnCount === 2 && isSuccess) ? {
        id: 'item_04_silver_dagger',
        name: 'Belati Perak Berukir Rune',
        category: 'Senjata',
        effect: '+2 Bonus Serangan Serangan Rahasia',
        icon: 'item_04_silver_dagger'
      } : null,
      consumedItem: null,
      addLedgerFact: `Mencapai ${chosenLoc.loc} pada giliran ke-${turnCount + 1}.`
    },
    choices: [
      {
        id: `c_${turnCount}_1`,
        text: 'Gunakan kekuatan fisik untuk menyingkirkan puing penghalang jalan',
        tone: 'bold'
      },
      {
        id: `c_${turnCount}_2`,
        text: 'Selidiki manuskrip rahasia atau simbol arkanum yang terukir di dinding',
        tone: 'curious'
      },
      {
        id: `c_${turnCount}_3`,
        text: 'Waspadai kemungkinan jebakan dengan naluri firasat bahayamu',
        tone: 'cautious'
      }
    ]
  };
}

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.apiKey = apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' ? apiKey : null;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (this.apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err) {
        console.warn('[GeminiService] Failed to initialize GoogleGenAI client, using fallback:', err.message);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  async generateOpeningScene(campaign, character) {
    if (!this.client) {
      return getFallbackOpening(campaign, character);
    }

    const systemPrompt = `Kamu adalah Dungeon Master (DM) legendaris untuk game Visual Novel Virtual Tabletop (VTT).
Tugasmu adalah merajut narasi interaktif D&D dengan Bahasa Indonesia sastrawi yang imersif dan atmosferik.
ATURAN WAJIB:
1. Respon WAJIB berupa objek JSON murni tanpa pembungkus markdown seperti \`\`\`json.
2. JANGAN PERNAH menggunakan karakter em dash (—). Gunakan koma, titik dua, tanda kurung, atau titik.
3. backgroundId WAJIB dipilih dari: bg_01_tavern, bg_02_cursed_woods, bg_03_sunken_citadel, bg_04_crimson_crypt, bg_05_vampire_castle, bg_06_alchemy_lab, bg_07_smuggler_cave, bg_08_arcane_library, bg_09_dragon_crater.
4. characterId WAJIB dipilih dari: char_hero_01 s.d 09 atau char_npc_01 s.d 09.
5. TANPA SISTEM DADU. Evaluasi aksi pemain murni berdasarkan logika dunia. Jika aksi pemain kreatif dan masuk akal, buat berhasil. Jika mustahil atau tidak masuk akal, buat gagal dengan alasan logis di dalam narasi.

SKEMA JSON RESMI:
{
  "chapterTitle": "string",
  "location": "string",
  "backgroundId": "string",
  "speaker": "string",
  "characterId": "string",
  "mood": "tense | mysterious | triumphant | ominous | peaceful",
  "dialogue": "string 2-4 kalimat sastrawi",
  "consequenceNote": "string",
  "stateUpdates": {
    "hpChange": 0,
    "goldChange": 0,
    "receivedItem": null,
    "consumedItem": null,
    "addLedgerFact": "string"
  },
  "choices": [
    {
      "id": "c1",
      "text": "string deskripsi aksi",
      "tone": "bold | cautious | curious | shrewd"
    }
  ]
}`;

    const prompt = `Kampanye: "${campaign.title}" (${campaign.premise}).
Karakter Pemain: ${character.name}, Ras: ${character.race}, Kelas: ${character.characterClass}, STR: ${character.str}, DEX: ${character.dex}, INT: ${character.int}, WIS: ${character.wis}, CHA: ${character.cha}, CON: ${character.con}.
Buatlah adegan pembuka Babak I yang sangat memukau dan menggugah imajinasi pemain.
PENTING: Pada teks 'dialogue', sampaikan terlebih dahulu Latar Belakang Cerita (Premise) dari kampanye ini secara naratif dan epik. Setelah latar belakang cerita diceritakan dengan jelas, barulah pada paragraf berikutnya berikan naratif situasi karakter saat ini yang mendorong pemain untuk mengambil tindakan atau pilihan pertama.`;

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }
        ]
      });

      let rawText = response.text ? response.text.trim() : '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) rawText = jsonMatch[0];
      const parsed = JSON.parse(rawText);
      parsed.dialogue = cleanText(parsed.dialogue);
      return sceneSchema.parse(parsed);
    } catch (err) {
      console.warn('[GeminiService] Error calling Gemini API for opening, using deterministic fallback:', err.message);
      return getFallbackOpening(campaign, character);
    }
  }

  async generateNextScene({ session, character, previousNode, actionTaken, checkResult }) {
    if (!this.client) {
      return getFallbackNextScene(previousNode, actionTaken, checkResult, character, session.turnCount);
    }

    const ledgerFacts = session?.worldLedger?.questFlags 
      ? Object.values(session.worldLedger.questFlags).join('. ') 
      : 'Belum ada kejadian penting.';

    const systemPrompt = `Kamu adalah Dungeon Master (DM) legendaris untuk game Visual Novel Virtual Tabletop (VTT).
Lanjutkan narasi cerita berdasarkan aksi pemain berikut:
Aksi Pemain: "${actionTaken.text}".
[MEMORI DM - Kejadian Sebelumnya]: ${ledgerFacts}

ATURAN WAJIB:
1. Respon WAJIB berupa objek JSON murni tanpa markdown \`\`\`json.
2. JANGAN PERNAH gunakan em dash (—). Gunakan koma atau tanda kurung.
3. TANPA SISTEM DADU. Evaluasi aksi pemain secara logika. Dukung kreativitas pemain! Jika aksi kreatif dan logis, narasikan keberhasilannya. Jika aksinya tidak masuk akal (misal: menebas gunung dengan pedang biasa), tolak dengan narasi kegagalan atau konsekuensi masuk akal (misal hp -4).
4. Sediakan 2-3 pilihan aksi baru.
5. Pertimbangkan [MEMORI DM] jika relevan dengan situasi saat ini.

SKEMA JSON:
{
  "chapterTitle": "string",
  "location": "string",
  "backgroundId": "string",
  "speaker": "string",
  "characterId": "string",
  "mood": "tense | mysterious | triumphant | ominous | peaceful",
  "dialogue": "string narasi mendalam",
  "consequenceNote": "string",
  "stateUpdates": {
    "hpChange": 0,
    "goldChange": 0,
    "receivedItem": null,
    "consumedItem": null,
    "addLedgerFact": "string (Fakta ringkas tindakan ini untuk disimpan ke Memori DM)"
  },
  "choices": [
    {
      "id": "c1",
      "text": "string",
      "tone": "bold | cautious | curious | shrewd"
    }
  ]
}`;

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] }
        ]
      });

      let rawText = response.text ? response.text.trim() : '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) rawText = jsonMatch[0];
      const parsed = JSON.parse(rawText);
      parsed.dialogue = cleanText(parsed.dialogue);
      return sceneSchema.parse(parsed);
    } catch (err) {
      console.warn('[GeminiService] Error calling Gemini API for next scene, using deterministic fallback:', err.message);
      return getFallbackNextScene(previousNode, actionTaken, checkResult, character, session.turnCount);
    }
  }
}

module.exports = new GeminiService();
