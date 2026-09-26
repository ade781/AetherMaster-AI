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
  backgroundId: z.string().optional(),
  speaker: z.string().default('Eldrin sang Barkeep'),
  characterId: z.string().default('char_npc_01_barkeep'),
  mood: z.enum(['tense', 'mysterious', 'triumphant', 'ominous', 'peaceful']).default('mysterious'),
  dialogue: z.string(),
  consequenceNote: z.string().nullable().optional(),
  stateUpdates: z.object({
    hpChange: z.number().default(0),
    manaChange: z.number().default(0),
    goldChange: z.number().default(0),
    receivedItem: z.any().nullable().optional(),
    consumedItem: z.any().nullable().optional(),
    addLedgerFact: z.string().nullable().optional()
  }).default({
    hpChange: 0,
    manaChange: 0,
    goldChange: 0,
    receivedItem: null,
    consumedItem: null,
    addLedgerFact: null
  }),
  missionLog: z.object({
    title: z.string().default('Jurnal Misi Petualang'),
    prologue: z.string().default(''),
    targetGoal: z.string().default('Tuntaskan penyelidikan dan atasi krisis utama.')
  }).nullable().optional(),
  choices: z.array(choiceSchema).default([]),
  combatEncounter: z.any().nullable().optional()
});

// Helper to remove any em dashes if LLM slips one in
function cleanText(text) {
  if (!text) return '';
  return text.replace(/—/g, ', ');
}

function parseSceneJson(rawText) {
  const match = rawText.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : rawText);
  if (parsed.dialogue) parsed.dialogue = cleanText(parsed.dialogue);
  if (parsed.missionLog?.prologue) parsed.missionLog.prologue = cleanText(parsed.missionLog.prologue);
  return sceneSchema.parse(parsed);
}

// Dynamic Deterministic Scene Generator reading directly from database Campaign model
function getFallbackOpening(campaign, character) {
  const charName = character?.name || 'Petualang';
  const charClass = character?.characterClass || 'Warrior';
  const title = campaign?.title || 'Petualangan Aether';
  const location = campaign?.title ? `Wilayah ${campaign.title}` : 'Kedai Whispering Tavern';
  const bgId = campaign?.defaultBackgroundId || 'bg_01_tavern';
  const npcId = campaign?.defaultNpcId || 'char_npc_01_barkeep';

  const npcNames = {
    char_npc_01_barkeep: 'Eldrin sang Barkeep',
    char_npc_02_informant: 'Informan Bayangan',
    char_npc_03_vampire: 'Lord Cassian',
    char_npc_05_dryad: 'Sylvanis sang Dryad',
    char_npc_06_goblin: 'Pedagang Goblin',
    char_npc_07_guard: 'Kapten Penjaga',
    char_npc_08_cultist: 'Pemuja Samudra Silus',
    char_npc_09_lich: 'Kaisar Tengkorak Purba',
    char_hero_01_paladin: 'Ksatria Aliansi',
    char_hero_02_ranger: 'Pemandu Rimba Lyra',
    char_hero_03_wizard: 'Pustakawan Bintang',
    char_hero_04_dwarf: 'Penambang Kurcaci Torin',
    char_hero_05_rogue: 'Penyusup Bayangan',
    char_hero_06_cleric: 'Pendeta Cahaya',
    char_hero_07_warlock: 'Penyihir Dimensi Malakor',
    char_hero_08_dragonborn: 'Prajurit Api Ignis',
    char_hero_09_bard: 'Penyair Pengelana Mandolin'
  };
  const speaker = npcNames[npcId] || 'Pemandu Petualangan';

  const missionLog = {
    title: `Jurnal Misi: ${title}`,
    prologue: `${campaign?.premise || 'Krisis tak terduga mengancam wilayah ini.'}\n\nKehadiran ${charName} sebagai seorang ${charClass} membawa harapan penting bagi penyelesaian masalah ini. Penyelidikan mendalam harus segera dilakukan untuk mengungkap fakta sebelum dampak buruk kian meluas.`,
    targetGoal: `Selesaikan investigasi di ${location} dan netralkan sumber ancaman.`
  };

  const dialogue = `${speaker} menatap ${charName} sang ${charClass} dengan raut wajah tegang saat kamu tiba di ${location}. "Syukurlah kamu lekas tiba," ucapnya pelan seraya menunjuk ke arah celah lorong di hadapanmu. "Situasi di sini tidak beres. Kita harus bertindak sekarang."`;

  // Campaign specific starting bonus item if available
  let receivedItem = null;
  if (campaign?.id === 'crypt_of_crimson') {
    receivedItem = {
      id: 'item_06_skeleton_key',
      name: 'Kunci Tengkorak Kuno',
      category: 'Kunci',
      effect: 'Dapat membuka gembok makam bawah tanah',
      icon: 'item_06_skeleton_key'
    };
  } else if (campaign?.id === 'whispering_tavern') {
    receivedItem = {
      id: 'item_01_potion_heal',
      name: 'Ramuan Penyembuh Darah',
      category: 'Obat',
      effect: 'Memulihkan 25 Hit Points seketika',
      icon: 'item_01_potion_heal'
    };
  }

  return {
    missionLog,
    chapterTitle: `Babak I: Langkah Awal di ${title}`,
    location,
    backgroundId: bgId,
    speaker,
    characterId: npcId,
    mood: 'mysterious',
    dialogue: cleanText(dialogue),
    consequenceNote: `Tiba di ${location} untuk memulai investigasi misi.`,
    stateUpdates: {
      hpChange: 0,
      manaChange: 0,
      goldChange: 10,
      receivedItem,
      consumedItem: null,
      addLedgerFact: `Memulai petualangan di ${title}.`
    },
    choices: [
      {
        id: 'c1',
        text: 'Amati situasi sekitar dengan saksama dan cari petunjuk tersembunyi',
        tone: 'cautious'
      },
      {
        id: 'c2',
        text: 'Melangkah maju mendekati sumber suara atau sosok di hadapanmu',
        tone: 'bold'
      },
      {
        id: 'c3',
        text: 'Selidiki ornamen dan energi gaib yang terpancar di sekitar tempat ini',
        tone: 'curious'
      }
    ]
  };
}

function getFallbackNextScene(previousNode, actionTaken, character, turnCount = 1) {
  const actionText = actionTaken?.text || 'Melangkah maju dengan waspada';
  const actionTone = actionTaken?.tone || 'cautious';
  const prevLoc = previousNode?.location || 'Ruang Petualangan';
  const prevSpk = previousNode?.speaker || 'Narator';
  const lowerAction = actionText.toLowerCase();
  const charName = character?.name || 'Petualang';
  const charClass = character?.characterClass || 'Pengelana';

  // 1. Off-rails / Nonsensical Action Detection
  const modernNonsenseWords = [
    'hp', 'handphone', 'smartphone', 'mobil', 'motor', 'pesawat', 'senjata api',
    'pistol', 'nuklir', 'bom atom', 'wifi', 'internet', 'komputer', 'laptop',
    'presiden', 'polisi', 'kantor', 'sekolah', 'chatgpt', 'roket', 'asdf', 'test', 'halo'
  ];
  const isOffRails = modernNonsenseWords.some(w => lowerAction === w || lowerAction.includes(` ${w} `) || lowerAction.startsWith(`${w} `) || lowerAction.endsWith(` ${w}`));

  if (isOffRails) {
    return {
      chapterTitle: `Babak ${Math.min(12, turnCount + 1)}: Suara Ganjil di Keheningan`,
      location: prevLoc,
      backgroundId: previousNode?.backgroundId || 'bg_01_tavern',
      speaker: prevSpk,
      characterId: previousNode?.characterId || 'char_npc_01_barkeep',
      mood: 'mysterious',
      dialogue: cleanText(
        `"${actionText}?" Suaramu bergaung aneh di ruangan ini. ${prevSpk} mengerutkan kening dan menatap ${charName} sang ${charClass} dengan keheranan mutlak. Kata-kata atau tindakanmu terdengar seperti igauan dari alam mimpi yang tak dipahami oleh siapa pun di dunia ini. Suasana sesaat menjadi canggung, sebelum desau angin tajam menyadarkanmu bahwa bahaya nyata masih mengintai dan menuntut fokus sang ${charClass}!`
      ),
      consequenceNote: `Tindakan aneh di luar nalar hanya mengundang kebingungan. Takdir memaksamu kembali fokus ke kenyataan.`,
      stateUpdates: {
        hpChange: -2,
        manaChange: 0,
        goldChange: 0,
        receivedItem: null,
        consumedItem: null,
        addLedgerFact: `${charName} sempat kehilangan fokus sebelum kembali ke alur petualangan.`
      },
      combatEncounter: null,
      choices: [
        { id: `c_${turnCount}_1`, text: `Kumpulkan kembali fokus pikiran ${charName} dan selidiki situasi sekitar secara waspada`, tone: 'cautious' },
        { id: `c_${turnCount}_2`, text: `Abaikan kecanggungan barusan dan kerahkan keahlian tempur sang ${charClass}`, tone: 'bold' }
      ]
    };
  }

  // 2. Stage 12: Grand Finale & Epilog (Batas Maksimal 12 Stage)
  if (turnCount >= 11) {
    return {
      chapterTitle: 'Babak XII: Grand Finale & Fajar Legenda',
      location: prevLoc,
      backgroundId: previousNode?.backgroundId || 'bg_18_celestial_sanctum',
      speaker: 'Dungeon Master',
      characterId: 'char_hero_01_paladin',
      mood: 'triumphant',
      dialogue: cleanText(
        `Dentang takdir menggema megah di seluruh penjuru! Dengan keberanian tak tergoyahkan, ${charName} sang ${charClass} akhirnya melancarkan aksinya: "${actionText}". Teror kelam yang selama ini menghantui berhasil dienyahkan selamanya. Cahaya fajar keemasan menerobos reruntuhan, menyinari sosokmu yang berdiri tegak sebagai pemenang sejati. Perjalanan 12 babak yang penuh intrik, darah, dan keajaiban ini telah mencapai puncaknya! Namamu kini terpatri abadi dalam catatan legenda benua Aether!`
      ),
      consequenceNote: `Babak 12 tercapai! Kemenangan mutlak menutup lembaran petualangan ${charName} sang ${charClass}.`,
      stateUpdates: {
        hpChange: 15,
        manaChange: 10,
        goldChange: 50,
        receivedItem: {
          id: 'item_trophy_aether',
          name: 'Medali Legenda Aether',
          category: 'Pusaka',
          effect: 'Tanda kehormatan tertinggi atas penaklukan 12 Babak Petualangan',
          icon: 'item_04_silver_dagger'
        },
        consumedItem: null,
        addLedgerFact: `${charName} menuntaskan petualangan di Babak 12 dengan kemenangan mutlak!`
      },
      combatEncounter: null,
      choices: [
        { id: 'finish_game', text: 'Tutup Lembaran Takdir & Rayakan Kemenangan Legenda', tone: 'bold' }
      ]
    };
  }

  // 3. Stage 10-11: Climax Buildup (Mendekati Babak 12 seolah-olah mau ending)
  if (turnCount >= 9) {
    return {
      chapterTitle: `Babak ${turnCount + 1}: Ambang Penentuan Akhir`,
      location: prevLoc,
      backgroundId: previousNode?.backgroundId || 'bg_11_throne_room',
      speaker: prevSpk,
      characterId: previousNode?.characterId || 'char_npc_09_lich',
      mood: 'tense',
      dialogue: cleanText(
        `Hawa mencekam berhembus kencang seolah semesta tahu babak penutup telah mendekat! ${charName} sang ${charClass} bergerak mantap untuk "${actionText}". Setiap detak jantung terasa begitu berat di atmosfer klimaks ini. Gerbang menuju konfrontasi pamungkas kini terbuka lebar di hadapanmu. Tinggal selangkah lagi menuju Babak 12, tempat di mana takdir akhir akan ditentukan untuk selamanya!`
      ),
      consequenceNote: `Mendekati babak akhir! Tensi cerita memuncak menuju klimaks Babak 12.`,
      stateUpdates: {
        hpChange: -3,
        manaChange: -2,
        goldChange: 20,
        receivedItem: null,
        consumedItem: null,
        addLedgerFact: `${charName} telah tiba di ambang pertempuran pamungkas menuju Babak 12.`
      },
      combatEncounter: null,
      choices: [
        { id: `c_${turnCount}_1`, text: `Kobarkan seluruh tekad ${charClass} dan songsong konfrontasi penutup di Babak 12`, tone: 'bold' },
        { id: `c_${turnCount}_2`, text: `Lafalkan sumpah terakhir dan amankan posisi sebelum gerbang takdir terbuka`, tone: 'cautious' }
      ]
    };
  }

  // 4. Contextual Story Reaction based on player's action
  let chapterTitle = `Babak ${turnCount + 1}: Investigasi Lanjutan`;
  let dialogue = '';
  let consequenceNote = '';
  let hpDelta = 0;
  let manaDelta = 0;
  let goldDelta = 0;
  let receivedItem = null;
  let choices = [];

  // A. Interogasi / Bicara / Tanya / Selidiki NPC (e.g. Pedagang Goblin, Barkeep, Informan)
  if (lowerAction.includes('interogasi') || lowerAction.includes('intrograsi') || lowerAction.includes('tanya') || lowerAction.includes('bicara') || lowerAction.includes('gertak') || lowerAction.includes('ancam') || lowerAction.includes('goblin') || lowerAction.includes('pedagang')) {
    chapterTitle = `Babak ${turnCount + 1}: Kesaksian di Balik Bayang`;
    consequenceNote = `Interogasi berhasil! ${prevSpk} membocorkan petunjuk rahasia penting.`;
    dialogue = cleanText(
      `Mata ${charName} menatap tajam ke arah lawan bicara saat kamu memutuskan untuk: "${actionText}". Terpojok oleh wibawa dan ancaman nyata sang ${charClass}, sosok di hadapanmu gemetar panik. "Tunggu! Jangan sakiti aku!" rintihnya dengan suara bergetar. Sembari menelan ludah, ia terpaksa membocorkan apa yang ia sembunyikan selama ini: sebuah rute rahasia yang melintasi koridor terkunci, serta peringatan mengenai dalang sebenarnya yang memantau setiap gerak-gerikmu dari kejauhan!`
    );
    goldDelta = 15;
    receivedItem = {
      id: 'item_01_health_potion',
      name: 'Ramuan Rahasia Tercecer',
      category: 'Potion',
      effect: 'Memulihkan 25 HP',
      icon: 'item_01_health_potion'
    };
    choices = [
      { id: `c_${turnCount}_1`, text: 'Desak lebih jauh mengenai siapa dalang yang mengawasimu', tone: 'bold' },
      { id: `c_${turnCount}_2`, text: 'Gunakan informasi rute rahasia tersebut untuk menyelinap ke ruang dalam', tone: 'cautious' },
      { id: `c_${turnCount}_3`, text: 'Ambil ramuan yang tercecer dan amankan area sekitar', tone: 'curious' }
    ];
  }
  // B. Penyelidikan / Pemeriksaan / Geledah / Buka Peti
  else if (lowerAction.includes('periksa') || lowerAction.includes('selidiki') || lowerAction.includes('geledah') || lowerAction.includes('buka') || lowerAction.includes('cari') || lowerAction.includes('peti') || lowerAction.includes('manuskrip') || lowerAction.includes('amati')) {
    chapterTitle = `Babak ${turnCount + 1}: Tabir Rahasia Tersingkap`;
    consequenceNote = `Penyelidikan cermat mengungkap petunjuk berharga di lokasi.`;
    dialogue = cleanText(
      `Dengan ketelitian tinggi, ${charName} segera melakukan: "${actionText}". Di bawah lapisan debu tebal dan sisa puing di ${prevLoc}, jemarimu menyentuh ukiran tersembunyi yang membentuk lambang fraksi kuno. Sebuah celah rahasia terbuka dengan bunyi klik pelan, menampakkan benda peninggalan yang masih memancarkan aura magis hangat.`
    );
    goldDelta = 20;
    receivedItem = {
      id: 'item_04_silver_dagger',
      name: 'Pusaka Ukiran Kuno',
      category: 'Pusaka',
      effect: 'Meningkatkan intuisi petualangan',
      icon: 'item_04_silver_dagger'
    };
    choices = [
      { id: `c_${turnCount}_1`, text: 'Amati simbol pada pusaka kuno tersebut untuk mencari arti maknanya', tone: 'curious' },
      { id: `c_${turnCount}_2`, text: 'Simpan pusaka dan segera susuri lorong baru yang terbuka', tone: 'bold' }
    ];
  }
  // C. Tindakan Fisik / Dobrak / Serang Hambatan
  else if (lowerAction.includes('serang') || lowerAction.includes('tebas') || lowerAction.includes('hantam') || lowerAction.includes('dobrak') || lowerAction.includes('pukul') || lowerAction.includes('tendang')) {
    chapterTitle = `Babak ${turnCount + 1}: Terobosan Tegas`;
    consequenceNote = `Aksi fisik tegas berhasil menyingkirkan hambatan di depanmu.`;
    dialogue = cleanText(
      `Tanpa ragu, ${charName} sang ${charClass} melancarkan: "${actionText}". Dentuman keras bergema saat kekuatan fisikmu menghancurkan rintangan yang menghalangi jalan. Reruntuhan berserakan di lantai, membuka jalan tembus yang sebelumnya tertutup rapat. Keberanianmu membuat suasana di ${prevLoc} seketika bergeser menguntungkanmu.`
    );
    hpDelta = -2;
    choices = [
      { id: `c_${turnCount}_1`, text: 'Melangkah mantap melewati rintangan yang telah dihancurkan', tone: 'bold' },
      { id: `c_${turnCount}_2`, text: 'Pasang kuda-kuda siaga memastikan tidak ada jebakan di balik puing', tone: 'cautious' }
    ];
  }
  // D. Penggunaan Mantra / Sihir
  else if (lowerAction.includes('sihir') || lowerAction.includes('mantra') || lowerAction.includes('arkana') || lowerAction.includes('spell') || lowerAction.includes('cahaya') || lowerAction.includes('api')) {
    chapterTitle = `Babak ${turnCount + 1}: Resonansi Magis`;
    consequenceNote = `Mantra arkanum berhasil mengubah struktur energi di sekitar.`;
    dialogue = cleanText(
      `Dengan konsentrasi penuh, ${charName} merapalkan: "${actionText}". Kilatan cahaya sihir membuncah dari ujung jemarimu, menerangi setiap sudut ${prevLoc} yang gelap gulita. Pola-pola magis di dinding bereaksi menyambut energi tersebut, melenyapkan kabut keraguan dan mengungkap keberadaan jalur tersembunyi.`
    );
    manaDelta = -6;
    choices = [
      { id: `c_${turnCount}_1`, text: 'Fokuskan energi sihir untuk memindai bahaya di jalur tersembunyi', tone: 'curious' },
      { id: `c_${turnCount}_2`, text: 'Segera melangkah maju sebelum pendar magis memudar', tone: 'bold' }
    ];
  }
  // E. Tindakan Waspada / Menyelinap / Sembunyi
  else if (lowerAction.includes('waspada') || lowerAction.includes('sembunyi') || lowerAction.includes('senyap') || lowerAction.includes('endap') || lowerAction.includes('intai')) {
    chapterTitle = `Babak ${turnCount + 1}: Langkah Dalam Bayang`;
    consequenceNote = `Kewaspadaan tinggi melindungimu dari bahaya tersembunyi.`;
    dialogue = cleanText(
      `${charName} mengambil langkah cerdik untuk: "${actionText}". Melebur dengan bayang-bayang di ${prevLoc}, kamu bergerak tanpa menimbulkan derit suara sedikit pun. Dari tempat persembunyian yang aman, kamu berhasil mengamati pergerakan sekitar dan mendapati celah terbaik untuk melanjutkan langkah tanpa terdeteksi.`
    );
    choices = [
      { id: `c_${turnCount}_1`, text: 'Manfaatkan celah pengawasan untuk menyelinap lebih jauh ke depan', tone: 'cautious' },
      { id: `c_${turnCount}_2`, text: 'Amati dari balik bayang-bayang dan tunggu momen paling tepat', tone: 'shrewd' }
    ];
  }
  // F. Aksi Bebas / Naratif Umum Lainnya
  else {
    chapterTitle = `Babak ${turnCount + 1}: Dinamika Langkah Baru`;
    consequenceNote = `Keputusanmu "${actionText.slice(0, 30)}" membawa perubahan nyata pada alur peristiwa.`;
    dialogue = cleanText(
      `Menyadari situasi yang berkembang, ${charName} sang ${charClass} mantap mengambil tindakan: "${actionText}". Keputusan berani tersebut seketika mengurai keheningan di ${prevLoc}. Sosok ${prevSpk} tampak terkesiap menyadari kesungguhan niatmu, lalu merespon dengan anggukan penuh hormat seraya mengarahkan pandangannya ke arah pintu gerbang berikutnya. Situasi kini sepenuhnya berada di bawah kendalimu.`
    );
    choices = [
      { id: `c_${turnCount}_1`, text: `Lanjutkan inisiatif dari langkah "${actionText.slice(0, 25)}" untuk menuntaskan tujuan`, tone: 'bold' },
      { id: `c_${turnCount}_2`, text: `Ajak ${prevSpk} berdiskusi mengenai rencana strategis selanjutnya`, tone: 'curious' },
      { id: `c_${turnCount}_3`, text: `Amankan posisi bertahan dan cermati setiap perubahan di sekitar`, tone: 'cautious' }
    ];
  }

  return {
    chapterTitle,
    location: prevLoc,
    backgroundId: previousNode?.backgroundId || 'bg_01_tavern',
    speaker: prevSpk,
    characterId: previousNode?.characterId || 'char_npc_01_barkeep',
    mood: previousNode?.mood || 'mysterious',
    dialogue,
    consequenceNote,
    stateUpdates: {
      hpChange: hpDelta,
      manaChange: manaDelta,
      goldChange: goldDelta,
      receivedItem,
      consumedItem: null,
      addLedgerFact: `Melakukan '${actionText.slice(0, 35)}' di ${prevLoc}.`
    },
    combatEncounter: null,
    choices
  };
}

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.apiKey = apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' ? apiKey : null;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';


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

  // Robust multi-model cascade runner
  async callWithFallback(prompt, systemPrompt) {
    if (!this.client) {
      throw new Error('GoogleGenAI client is not initialized');
    }

    const candidateModels = [
      this.modelName,
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite'
    ].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);

    let lastError = null;
    for (const model of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            const jitter = Math.floor(Math.random() * 500) + 500;
            await new Promise(r => setTimeout(r, jitter));
          }

          const generatePromise = this.client.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt ? systemPrompt + '\n\n' : ''}${prompt}` }]
              }
            ]
          });

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout: Model ${model} took longer than 25000ms`)), 25000)
          );

          const response = await Promise.race([generatePromise, timeoutPromise]);

          if (response && response.text) {
            return response.text.trim();
          }
        } catch (err) {
          lastError = err;
          console.warn(`[GeminiService] Model '${model}' call failed (${err.message}). Cascading...`);
          break;
        }
      }
    }

    throw lastError || new Error('All candidate models failed');
  }

  async generateOpeningScene(campaign, character) {
    if (!this.client) {
      return getFallbackOpening(campaign, character);
    }

    const charName = character?.name || 'Petualang';
    const charClass = character?.characterClass || 'Pengelana';
    const targetBgId = campaign?.defaultBackgroundId || 'bg_01_tavern';
    const targetNpcId = campaign?.defaultNpcId || 'char_npc_01_barkeep';

    const systemPrompt = `Kamu adalah Dungeon Master (DM) untuk game RPG Visual Novel interaktif.
Tugasmu adalah menyusun pembuka petualangan yang ON-POINT, ATMOSFERIK, dan BEBAS HIPERBOLA LEBAY.
Gunakan Bahasa Indonesia sastrawi lugas, taktis, dan fokus pada situasi nyata.

ATURAN STRUKTUR DUA KOMPONEN PEMBUKA:
1. 'missionLog' (Jurnal Misi & Prolog Personal):
   - 'title': Judul berkas misi singkat (misal: "Jurnal Misi: [Nama Misi]")
   - 'prologue': Narasi 2-3 paragraf mengalir tentang latar belakang kampanye, krisis yang dihadapi, serta peran ${charName} sang ${charClass} (Ras: ${character.race || 'Human'}) dalam penugasan ini. Jangan gunakan subjudul kaku seperti "Latar Belakang: ...", biarkan mengalir alami dan elegan.
   - 'targetGoal': 1 kalimat lugas sasaran utama misi yang harus dicapai.

2. PANGGUNG BABAK I IN MEDIA RES ('chapterTitle', 'location', 'speaker', 'dialogue', 'choices'):
   - Adegan Babak I HARUS LANGSUNG BERADA DI TENGAH SITUASI AKTIF / DI LOKASI KEJADIAN (in media res).
   - DILARANG KERAS mengulang teks latar belakang dari 'missionLog'!
   - Teks 'dialogue' fokus pada situasi darurat saat ini di depan mata, ucapan langsung dari NPC di lokasi yang menyambut kedatangan ${charName}, serta ketegangan nyata yang menuntut tindakan pertama pemain.
   - Maksimal 2-3 kalimat tajam dan berbobot.

3. GAYA BAHASA:
   - On-point, lugas, deskriptif taktis.
   - HINDARI kata-kata hiperbolis yang terlalu puitis berlebihan ("takdir memanggil", "hawa maut merayap dingin", "jiwa bergetar hebat", dll.).
   - JANGAN PERNAH gunakan em dash (—). Gunakan koma atau titik.
   - MUTLAK TANPA unsur dadu (d20, DC, roll).
   - combatEncounter WAJIB null.
   - 'backgroundId' WAJIB bernilai "${targetBgId}".

SKEMA JSON RESMI:
{
  "missionLog": {
    "title": "string",
    "prologue": "string 2-3 paragraf personal",
    "targetGoal": "string sasaran utama"
  },
  "chapterTitle": "Babak I: [Judul Babak]",
  "location": "${campaign.title || 'Wilayah Petualangan'}",
  "backgroundId": "${targetBgId}",
  "speaker": "string (nama NPC atau Narator)",
  "characterId": "${targetNpcId}",
  "mood": "tense | mysterious | triumphant | ominous | peaceful",
  "dialogue": "string adegan langsung di TKP tanpa mengulang prolog",
  "consequenceNote": "string ringkas",
  "stateUpdates": {
    "hpChange": 0,
    "manaChange": 0,
    "goldChange": 0,
    "receivedItem": null,
    "consumedItem": null,
    "addLedgerFact": "string"
  },
  "combatEncounter": null,
  "choices": [
    {
      "id": "c1",
      "text": "string tindakan taktis (singkat, lugas)",
      "tone": "bold | cautious | curious | shrewd"
    },
    {
      "id": "c2",
      "text": "string tindakan taktis (singkat, lugas)",
      "tone": "bold | cautious | curious | shrewd"
    }
  ]
}`;

    const prompt = `Kampanye: "${campaign.title}" (${campaign.premise}).
Karakter Pemain: ${charName}, Ras: ${character?.race || 'Human'}, Kelas: ${charClass}.
Latar Visual Panggung: WAJIB gunakan backgroundId: "${targetBgId}".
Buatlah:
1. 'missionLog' yang memadukan premis kampanye dengan latar belakang personal ${charName} sang ${charClass} serta targetGoal yang jelas.
2. Adegan panggung Babak I yang dimulai langsung di tempat kejadian (in media res), di mana ${charName} sudah berada di lokasi dan langsung menghadapi situasi pertama yang menuntut pilihan aksi segera. Jangan ulangi isi missionLog di teks dialogue!`;

    try {
      const parsed = parseSceneJson(await this.callWithFallback(prompt, systemPrompt));
      if (!parsed.backgroundId || (parsed.backgroundId === 'bg_01_tavern' && targetBgId !== 'bg_01_tavern')) {
        parsed.backgroundId = targetBgId;
      }
      return parsed;
    } catch (err) {
      console.warn('[GeminiService] Error calling Gemini API for opening, using deterministic fallback:', err.message);
      return getFallbackOpening(campaign, character);
    }
  }

  async generateNextScene({ session, character, previousNode, actionTaken, recentHistory }) {
    if (!this.client) {
      return getFallbackNextScene(previousNode, actionTaken, character, session?.turnCount || 1);
    }

    const ledgerFacts = session?.worldLedger?.questFlags 
      ? Object.values(session.worldLedger.questFlags).join('. ') 
      : 'Belum ada catatan petualangan khusus.';

    const prevLocation = previousNode?.location || 'Ruang Petualangan';
    const prevSpeaker = previousNode?.speaker || 'Narator';
    const prevDialogue = previousNode?.dialogueText || '';
    const prevBgId = previousNode?.backgroundId || 'bg_01_tavern';
    const actionText = actionTaken?.text || actionTaken?.customText || 'Melangkah maju dengan waspada';
    const actionTone = actionTaken?.tone || 'cautious';

    // Rolling Context Window from recent story history (last 3-4 nodes)
    let historyContext = '';
    if (recentHistory && Array.isArray(recentHistory) && recentHistory.length > 0) {
      historyContext = recentHistory.map((h, idx) => {
        const turnLabel = h.turnCount ? `Turn ${h.turnCount}` : `Langkah ${idx + 1}`;
        return `[${turnLabel} | Lokasi: ${h.location || prevLocation} | Pembicara: ${h.speaker || 'DM'}]: "${cleanText(h.dialogueText || '')}"`;
      }).join('\n');
    } else {
      historyContext = `[Langkah Terakhir | Lokasi: ${prevLocation} | Pembicara: ${prevSpeaker}]: "${cleanText(prevDialogue)}"`;
    }

    const repEntries = Object.entries(session?.worldLedger?.reputation || {});
    const repSummary = repEntries.length > 0
      ? repEntries.map(([f, score]) => `${f}: ${score >= 0 ? '+' + score : score}`).join(', ')
      : 'Netral (0)';

    const turnCount = session?.turnCount || 1;
    const charName = character?.name || 'Petualang';
    const charClass = character?.characterClass || 'Pengelana';

    // Stage Pacing & Climax Structure (Batas 12 Stage)
    let stagePacingContext = '';
    if (turnCount >= 11) {
      stagePacingContext = `
[BATAS 12 STAGE - BABAK XII: GRAND FINALE & EPILOG KEMENANGAN]:
- Ini adalah BABAK 12 (BABAK TERAKHIR / ENDING PETUALANGAN)!
- Selesaikan seluruh konflik kampanye, tuntaskan ancaman musuh utama, dan narasikan epilog kemenangan yang sangat membanggakan bagi ${charName} sang ${charClass}!
- 'chapterTitle' WAJIB: "Babak XII: Grand Finale & Fajar Kemenangan".
- 'choices' WAJIB HANYA 1 opsi penutup: [{"id": "finish_game", "text": "Tutup Lembaran Takdir & Rayakan Kemenangan Legenda", "tone": "bold"}].
`;
    } else if (turnCount >= 9) {
      stagePacingContext = `
[MENDEKATI AKHIR - BABAK ${turnCount + 1} DARI 12 (CLIMAX / PENENTUAN MAU ENDING)]:
- Petualangan sudah sangat mendekati Babak 12 akhir!
- Suasana narasi HARUS DIBIKIN SEOLAH-OLAH MAU ENDING: Tensi klimaks memuncak tinggi, pintu gerbang ruang bos/sarang musuh utama terbuka, atau misteri inti terpampang di depan mata!
- Siapkan ${charName} sang ${charClass} untuk pertarungan terakhir yang menentukan takdir semesta di Babak 12!
`;
    } else {
      stagePacingContext = `
[PROGRESI PETUALANGAN - BABAK ${turnCount + 1} DARI 12]:
- Eksplorasi taktis, intrik, interogasi, percakapan bermakna, dan penyelidikan dunia fantasi menuju misi utama.
`;
    }

    const offRailsInstruction = `
[PENANGANAN TINDAKAN MELENCENG / NYELENEH / OUT-OF-CONTEXT]:
- Jika tindakan pemain "${actionText}" absurd, aneh, menggunakan konsep modern di luar dunia fantasi (seperti handphone, mobil, senjata api, internet, komputer, hal konyol), JANGAN tolak dengan pesan error teknis!
- Tanggapi sebagai Dungeon Master yang cerdas dan logis di dalam dunia fantasi:
  * Narasikan kebingungan orang-orang sekitar atau NPC yang menatap heran ${charName} sang ${charClass} seolah meracau dalam igauan mimpi.
  * Berikan konsekuensi logis: tindakan tersebut gagal dan membuat pemain kehilangan momentum, atau terkena luka ringan (-2 s.d -5 HP di 'hpChange') akibat kelengahan.
  * Secara elegan dan tegas, tarik kembali perhatian ${charName} ke ancaman nyata di depan mata!
`;

    const systemPrompt = `Kamu adalah Dungeon Master (DM) legendaris untuk game Visual Novel RPG interaktif.
TUGAS UTAMA: Menulis adegan narasi berikutnya yang SEPENUHNYA TANGGAP, SPESIFIK, MENDALAM, dan REAKTIF terhadap aksi pemain.

KONTEKS DUNIA & RIWAYAT LANGKAH SEBELUMNYA:
${historyContext}

KONDISI PEMAIN SAAT INI:
- Karakter: ${charName} (Kelas / Role: ${charClass}, Ras: ${character?.race || 'Human'}, HP: ${character?.hp ?? 100}/${character?.maxHp ?? 100}, Mana: ${character?.mana ?? 50}/${character?.maxMana ?? 50}, Gold: ${character?.gold ?? 0})
- Lokasi Terakhir: ${prevLocation}
- Latar Aktif Saat Ini: "${prevBgId}"
- Memori Dunia: ${ledgerFacts}
- Reputasi Fraksi: ${repSummary}
${stagePacingContext}
${offRailsInstruction}

TINDAKAN YANG DIAMBIL PEMAIN:
Aksi: "${actionText}"
Nada Tindakan: ${actionTone}

ATURAN REAKTIVITAS NARATIF & DIALOG (SANGAT KRUSIAL):
1. REAKTIFITAS LANGSUNG PADA PARAGRAF PERTAMA:
   - Paragraf pertama teks 'dialogue' HARUS SECARA NYATA DAN SPESIFIK menceritakan eksekusi aksi "${actionText}".
   - Jika aksi pemain adalah menginterogasi, berbicara, atau bertanya kepada NPC/pedagang: Tuliskan dialog ucapan NPC tersebut secara langsung menggunakan tanda petik "...", gambarkan reaksi emosionalnya (gemetar ketakutan, membual licik, atau terkesiap kagum), dan ungkapkan petunjuk/informasi rahasia yang terkuak!
   - Jika aksi pemain adalah memeriksa, menggeledah, atau mencari: Ceritakan secara rinci apa yang ditemukan, mekanisme apa yang terbuka, atau benda apa yang terungkap.
   - DILARANG KERAS menggunakan kalimat template generik atau jawaban klise hambar yang tidak berhubungan dengan aksi pemain!
2. MUTLAK TANPA UNSUR DADU & TANPA COMBAT TERPISAH:
   - DILARANG KERAS menyebut kata dadu, lemparan dadu, d20, DC, check, roll, atau modifier dadu di seluruh teks 'dialogue', 'consequenceNote', maupun 'choices'!
   - Seluruh alur berjalan mengalir murni secara visual novel naratif.
   - Evaluasi keberhasilan aksi didasarkan pada logika situasi fantasi, kecerdikan tindakan, dan keahlian kelas ${charClass}.
   - 'combatEncounter' WAJIB selalu bernilai null.
3. PERSONALISASI NAMA & KELAS:
   - Panggil nama "${charName}" dan sesuaikan sudut pandang narasi dengan kelas "${charClass}".
4. KONSISTENSI LOKASI & LATAR (SPATIAL ANCHORING):
   - 'backgroundId' WAJIB TETAP MENGGUNAKAN "${prevBgId}" KECUALI aksi pemain secara eksplisit adalah berpindah ruangan, keluar gedung, menembus portal, atau melakukan perjalanan ke lokasi baru.
5. KONSEKUENSI NYATA ('consequenceNote'):
   - Tuliskan 1 kalimat ringkas mengenai dampak nyata dari aksi pemain tersebut.
6. PERUBAHAN STATUS ('stateUpdates'):
   - Jika merapal mantra/sihir: kurangi mana (-4 s.d -10).
   - Jika menemukan harta/imbalan: tambahkan gold (+5 s.d +25).
   - Jika terluka: kurangi hp (-2 s.d -8).
   - Jika memperoleh barang/ramuan/kunci: isi pada 'receivedItem' (objek { id, name, category, effect, icon }).
7. PILIHAN TINDAKAN BERIKUTNYA ('choices'):
   - Sediakan 2 sampai 3 pilihan aksi taktis baru yang ALAMI, RINGKAS (maksimal 1 kalimat lugas), dan relevan dengan situasi terbaru (Kecuali jika turnCount >= 11, berikan opsi penutup finish_game).
8. FORMAT TEKS & GAYA BAHASA:
   - Gunakan Bahasa Indonesia sastrawi yang ON-POINT, taktis, dan atmosferik.
   - Hindari hiperbola bombastis berlebihan ("lebay"). Ceritakan peristiwa secara lugas dan mengena.
   - JANGAN PERNAH gunakan em dash (—). Gunakan koma, titik dua, atau tanda kurung.
   - Respon WAJIB berupa objek JSON murni tanpa pembungkus markdown \`\`\`json.

SKEMA JSON RESMI:
{
  "chapterTitle": "string",
  "location": "string",
  "backgroundId": "string (pilih dari bg_01 s.d bg_29)",
  "speaker": "string (nama NPC atau Narator)",
  "characterId": "string (char_hero_01 s.d 09 atau char_npc_01 s.d 09)",
  "mood": "tense | mysterious | triumphant | ominous | peaceful",
  "dialogue": "string narasi mendalam yang langsung menjawab dampak aksi pemain secara nyata",
  "consequenceNote": "string ringkas dampak aksi",
  "stateUpdates": {
    "hpChange": 0,
    "manaChange": 0,
    "goldChange": 0,
    "receivedItem": null,
    "consumedItem": null,
    "addLedgerFact": "string ringkas fakta baru untuk memori DM"
  },
  "combatEncounter": null,
  "choices": [
    {
      "id": "c1",
      "text": "string opsi aksi lanjutan (singkat dan lugas)",
      "tone": "bold | cautious | curious | shrewd"
    },
    {
      "id": "c2",
      "text": "string opsi aksi lanjutan (singkat dan lugas)",
      "tone": "bold | cautious | curious | shrewd"
    }
  ]
}`;

    const prompt = `Lanjutkan petualangan untuk ${charName} sang ${charClass}! Aksi pemain yang baru saja diambil: "${actionText}". Ceritakan reaksi langsungnya secara mendalam, sertakan dialog NPC jika berinteraksi, dan kembangkan cerita babak ini!`;

    try {
      const parsed = parseSceneJson(await this.callWithFallback(prompt, systemPrompt));
      if (!parsed.backgroundId || (parsed.backgroundId === 'bg_01_tavern' && prevBgId !== 'bg_01_tavern')) {
        parsed.backgroundId = prevBgId;
      }
      return parsed;
    } catch (err) {
      console.warn('[GeminiService] Error calling Gemini API for next scene, using smart contextual fallback:', err.message);
      return getFallbackNextScene(previousNode, actionTaken, character, session?.turnCount || 1);
    }
  }
}

module.exports = new GeminiService();


