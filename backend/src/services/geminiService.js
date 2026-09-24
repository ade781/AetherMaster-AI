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
  return sceneSchema.parse(parsed);
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

// Helper to dynamically extract action context and generate reactive text
function getFallbackNextScene(previousNode, actionTaken, checkResult, character, turnCount = 1) {
  const actionText = actionTaken?.text || 'Melangkah maju dengan waspada';
  const actionTone = actionTaken?.tone || 'cautious';
  const prevLoc = previousNode?.location || 'Ruang Petualangan';
  const prevSpk = previousNode?.speaker || 'Narator';
  const lowerAction = actionText.toLowerCase();

  // Active combat resolution if previous node had combat encounter
  if (previousNode?.combatEncounter) {
    const enemy = previousNode.combatEncounter;
    if (actionTaken?.id === 'combat_flee' || lowerAction.includes('mundur') || lowerAction.includes('lari') || lowerAction.includes('kabur')) {
      return {
        chapterTitle: `Babak ${turnCount + 1}: Meloloskan Diri`,
        location: prevLoc,
        backgroundId: previousNode.backgroundId || 'bg_04_crimson_crypt',
        speaker: 'Narator',
        characterId: 'char_hero_01_paladin',
        mood: 'tense',
        dialogue: `Dengan refleks sigap dan langkah lincah, kamu berhasil menangkis ayunan cakar ${enemy.enemyName} lalu melompat mundur menyusuri celah koridor sempit. Musuh meraung geram namun kehilangan jejakmu di dalam kegelapan.`,
        consequenceNote: `Berhasil mundur taktis dan selamat dari ancaman ${enemy.enemyName}.`,
        stateUpdates: {
          hpChange: 0,
          manaChange: 0,
          goldChange: 0,
          receivedItem: null,
          consumedItem: null,
          addLedgerFact: `Berhasil meloloskan diri dari ${enemy.enemyName}.`
        },
        combatEncounter: null,
        choices: [
          { id: `c_${turnCount}_1`, text: 'Atur napas lalu telusuri rute alternatif yang lebih aman', tone: 'cautious' },
          { id: `c_${turnCount}_2`, text: 'Cari tempat perlindungan untuk memeriksa sisa perbekalan', tone: 'curious' },
          { id: `c_${turnCount}_3`, text: 'Siapkan posisi siaga bila musuh kembali mengejar', tone: 'bold' }
        ]
      };
    }

    const isSpell = actionTaken?.id === 'combat_spell' || lowerAction.includes('sihir') || lowerAction.includes('mantra') || lowerAction.includes('fireball') || lowerAction.includes('energi');
    return {
      chapterTitle: `Babak ${turnCount + 1}: Kemenangan Gemilang`,
      location: prevLoc,
      backgroundId: previousNode.backgroundId || 'bg_04_crimson_crypt',
      speaker: 'Narator',
      characterId: 'char_hero_01_paladin',
      mood: 'triumphant',
      dialogue: cleanText(
        isSpell
          ? `Semburan sihir berkobar menerjang telak ${enemy.enemyName}! Sambaran arkanum melumat persendian tulangnya hingga hancur berkeping-keping di lantai batu. Kutukan di ruangan ini sirna seketika meninggalkan rasa lega yang mendalam.`
          : `Dengan ayunan senjata penuh keyakinan, tebasanmu membelah pertahanan ${enemy.enemyName}! Tubuh lawan ambruk terhempas dan hancur tak berdaya. Ancaman maut berhasil kamu tumpas tuntas!`
      ),
      consequenceNote: `Kemenangan mutlak! ${enemy.enemyName} berhasil ditumpas. Memperoleh ${enemy.rewardGold || 25} Koin Emas.`,
      stateUpdates: {
        hpChange: -3,
        manaChange: isSpell ? -8 : 0,
        goldChange: enemy.rewardGold || 25,
        receivedItem: {
          id: 'item_06_skeleton_key',
          name: 'Kunci Tulang Tua',
          category: 'Kunci',
          effect: 'Dapat membuka peti besi terkutuk',
          icon: 'item_06_skeleton_key'
        },
        consumedItem: null,
        addLedgerFact: `Mengalahkan ${enemy.enemyName} dan menemukan Kunci Tulang Tua.`
      },
      combatEncounter: null,
      choices: [
        { id: `c_${turnCount}_1`, text: 'Gunakan Kunci Tulang Tua untuk membuka peti besi di sudut ruangan', tone: 'curious' },
        { id: `c_${turnCount}_2`, text: 'Telusuri lorong lebih dalam menuju altar suci yang tersembunyi', tone: 'bold' },
        { id: `c_${turnCount}_3`, text: 'Periksa sisa reruntuhan untuk mencari catatan rahasia musuh', tone: 'shrewd' }
      ]
    };
  }

  // Combat encounter if turn >= 3 and not already in combat
  if (turnCount >= 3 && !previousNode?.combatEncounter) {
    return {
      chapterTitle: 'Babak Pertarungan: Teror di Balik Pintu Rahasia',
      location: 'Ruang Bawah Tanah Kedai Kuno',
      backgroundId: 'bg_04_crimson_crypt',
      speaker: 'Prajurit Tengkorak Terkutuk',
      characterId: 'monster_01_skeleton',
      mood: 'tense',
      dialogue: cleanText(
        `Tindakanmu yang memutuskan untuk "${actionText}" memicu getaran keras di lantai batu! Debu berhamburan disusul derak tulang bergeretak. Sesosok Prajurit Tengkorak bangkit dengan pedang berkarat siap menerkam!`
      ),
      consequenceNote: `Aksimu "${actionText.slice(0, 45)}..." memicu kemunculan musuh.`,
      stateUpdates: {
        hpChange: -4,
        manaChange: 0,
        goldChange: 0,
        receivedItem: null,
        consumedItem: null,
        addLedgerFact: `Menghadapi Prajurit Tengkorak setelah: ${actionText.slice(0, 40)}.`
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
          text: 'Lepaskan semburan energi sihir untuk melumat sendi tengkorak',
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

  // Regular progression across all visual novel environments
  const locations = [
    { title: 'Lorong Bawah Tanah', loc: 'Ruang Bawah Tanah Kuno', bg: 'bg_06_alchemy_lab', spk: 'Informan Bertudung', char: 'char_npc_02_informant', mood: 'mysterious' },
    { title: 'Pustaka Terlarang', loc: 'Arcane Library', bg: 'bg_08_arcane_library', spk: 'Arwah Penyihir Perak', char: 'char_hero_03_wizard', mood: 'tense' },
    { title: 'Singgasana Bayangan', loc: 'Ruang Takhta Kastil Vampir', bg: 'bg_05_vampire_castle', spk: 'Lord Valerius', char: 'char_npc_03_vampire', mood: 'ominous' },
    { title: 'Reruntuhan Monolit', loc: 'Candi Kuno Elven Terlupakan', bg: 'bg_10_ancient_ruins', spk: 'Penjaga Monolit', char: 'char_hero_01_paladin', mood: 'mysterious' },
    { title: 'Aula Takhta Gotik', loc: 'Katedral Kuno Kerajaan', bg: 'bg_11_throne_room', spk: 'Kanselir Kerajaan', char: 'char_npc_01_barkeep', mood: 'tense' },
    { title: 'Kedalaman Underdark', loc: 'Gua Kristal Bioluminesensi', bg: 'bg_12_underdark_cavern', spk: 'Pengelana Bawah Tanah', char: 'char_hero_02_rogue', mood: 'mysterious' },
    { title: 'Bengkel Vulkanik', loc: 'Tempa Lahar Kurcaci', bg: 'bg_13_lava_forge', spk: 'Pandai Besi Magma', char: 'char_hero_01_paladin', mood: 'triumphant' },
    { title: 'Puncak Badai Es', loc: 'Tebing Frost Peak', bg: 'bg_14_frost_peak', spk: 'Roh Gargoyle Es', char: 'char_hero_03_wizard', mood: 'ominous' },
    { title: 'Makam Gotik Berkabut', loc: 'Pemakaman Tua Malakor', bg: 'bg_15_haunted_graveyard', spk: 'Penjaga Kubur', char: 'char_npc_02_informant', mood: 'ominous' },
    { title: 'Pondok Rawa Penyihir', loc: 'Rawa Primordial Bayou', bg: 'bg_16_swamp_huts', spk: 'Nenek Sihir Rawa', char: 'char_npc_02_informant', mood: 'mysterious' },
    { title: 'Kuil Pasir Terkubur', loc: 'Piramida Necropolis Gurun', bg: 'bg_17_desert_temple', spk: 'Guardian Anubis', char: 'char_hero_01_paladin', mood: 'mysterious' },
    { title: 'Sanctum Astral', loc: 'Platform Rasi Bintang Bintang', bg: 'bg_18_celestial_sanctum', spk: 'Entitas Bintang', char: 'char_hero_03_wizard', mood: 'peaceful' },
    { title: 'Benteng Gerhana', loc: 'Spire Dimensi Shadowfell', bg: 'bg_19_shadowfell_citadel', spk: 'Panglima Bayangan', char: 'char_npc_03_vampire', mood: 'ominous' },
    { title: 'Geladak Badai', loc: 'Galleon Samudra Lepas', bg: 'bg_20_pirate_ship_deck', spk: 'Kapten Bajak Laut', char: 'char_hero_02_rogue', mood: 'tense' },
    { title: 'Benteng Perang Goblin', loc: 'Perkemahan Api Unggun', bg: 'bg_21_goblin_war_camp', spk: 'Kepala Suku Goblin', char: 'char_npc_01_barkeep', mood: 'tense' },
    { title: 'Gua Kristal Aether', loc: 'Tambang Kristal Energi', bg: 'bg_22_crystal_mines', spk: 'Pencari Kristal', char: 'char_hero_03_wizard', mood: 'mysterious' },
    { title: 'Ruang Jeruji Besi', loc: 'Penjara Bawah Tanah Kuno', bg: 'bg_23_dungeon_torture_chamber', spk: 'Sipir Bertopeng Besi', char: 'char_npc_02_informant', mood: 'ominous' },
    { title: 'Hutan Senja Feywild', loc: 'Lembah Flora Bercahaya', bg: 'bg_24_feywild_glade', spk: 'Peri Feywild', char: 'char_hero_03_wizard', mood: 'peaceful' },
    { title: 'Reruntuhan Katedral', loc: 'Nave Katedral Mawar Pecah', bg: 'bg_25_abandoned_cathedral', spk: 'Uskup Arwah', char: 'char_hero_01_paladin', mood: 'mysterious' },
    { title: 'Brankas Roda Gigi', loc: 'Kubah Mesin Mechanus', bg: 'bg_26_clockwork_vault', spk: 'Penjaga Otomaton', char: 'char_hero_02_rogue', mood: 'tense' },
    { title: 'Gunung Harta Karun', loc: 'Sarang Naga Emas', bg: 'bg_27_dragon_hoard', spk: 'Naga Purba Wyrm', char: 'char_hero_01_paladin', mood: 'triumphant' },
    { title: 'Lorong Kota Basah', loc: 'Gang Pasar Gotik Malam Hari', bg: 'bg_28_city_market_alley', spk: 'Pedagang Bayangan', char: 'char_npc_02_informant', mood: 'mysterious' },
    { title: 'Pusaran Dimensi Abyssal', loc: 'Retakan Kosmis Jurang', bg: 'bg_29_abyssal_rift', spk: 'Penjaga Portal Void', char: 'char_hero_03_wizard', mood: 'ominous' }
  ];

  const locIdx = Math.min(locations.length - 1, Math.max(0, turnCount % locations.length));
  const chosenLoc = locations[locIdx];

  let consequence = '';
  let outcomeDialogue = '';
  let hpDelta = 0;
  let manaDelta = 0;
  let goldDelta = 0;

  if (lowerAction.includes('sihir') || lowerAction.includes('mantra') || lowerAction.includes('spell') || lowerAction.includes('fireball') || lowerAction.includes('arkana')) {
    manaDelta = -6;
  }

  const lethalKeywords = ['lahar', 'magma', 'kawah', 'racun', 'jurang', 'bunuh diri', 'terjun', 'tanpa perlindungan'];
  const isLethal = lethalKeywords.some(k => lowerAction.includes(k));

  if (isLethal) {
    hpDelta = -25;
    consequence = `Dampak fatal: Aksi ceroboh menerjang bahaya maut mengakibatkan luka parah dan kehancuran fisik!`;
    outcomeDialogue = `Kamu nekat memutuskan untuk: "${actionText}". Tanpa perlindungan memadai, kobaran bahaya mematikan seketika melalap tubuhmu, membakar daging dan meremukkan daya tahan ragamu hingga ke batas maut!`;
  } else if (lowerAction.includes('serang') || lowerAction.includes('tebas') || lowerAction.includes('kekuatan') || lowerAction.includes('hantam') || actionTone === 'bold') {
    consequence = `Dampak: Aksi fisik berhasil menembus hambatan.`;
    outcomeDialogue = `Kamu memutuskan untuk: "${actionText}". Dengan pengerahan tenaga penuh, langkah agresifmu membuahkan hasil nyata, meremukkan rintangan dan membuka celah di ${chosenLoc.loc}. ${chosenLoc.spk} memperhatikan tekadmu yang tak gentar.`;
    goldDelta = 10;
  } else if (lowerAction.includes('selidiki') || lowerAction.includes('manuskrip') || lowerAction.includes('simbol') || lowerAction.includes('amati') || actionTone === 'curious') {
    consequence = `Dampak: Pengamatan cermat berhasil mengungkap rahasia tersembunyi.`;
    outcomeDialogue = `Kamu memfokuskan perhatian untuk: "${actionText}". Matamu yang jeli mendapati petunjuk penting yang terselubung bayang-bayang di ${chosenLoc.loc}. ${chosenLoc.spk} tersenyum tipis mengakui ketajaman firasatmu.`;
    goldDelta = 15;
  } else if (lowerAction.includes('waspada') || lowerAction.includes('sembunyi') || lowerAction.includes('senyap') || lowerAction.includes('mundur') || actionTone === 'cautious') {
    consequence = `Dampak: Kewaspadaan tinggi berhasil melindungimu dari sergapan.`;
    outcomeDialogue = `Kamu melangkah dengan sangat berhati-hati untuk: "${actionText}". Naluri bertahan hidupmu terbukti tepat, kamu berhasil membaca pergerakan lawan di ${chosenLoc.loc} tanpa terluka.`;
  } else {
    consequence = `Dampak: Keputusanmu langsung mengubah situasi di sekelilingmu.`;
    outcomeDialogue = `Kamu segera mengambil keputusan untuk: "${actionText}". Tindakan tegas tersebut seketika memecah ketegangan di ${chosenLoc.loc}, membuat ${chosenLoc.spk} harus menyesuaikan sikapnya terhadap keberadaanmu.`;
    goldDelta = 5;
  }

  return {
    chapterTitle: `Babak ${turnCount + 1}: ${chosenLoc.title}`,
    location: chosenLoc.loc,
    backgroundId: chosenLoc.bg,
    speaker: chosenLoc.spk,
    characterId: chosenLoc.char,
    mood: chosenLoc.mood,
    dialogue: cleanText(
      `${outcomeDialogue} Hawa misterius menyelimuti area sekitar. Di hadapanmu terbentang pilihan baru yang menuntut keputusan taktis berikutnya.`
    ),
    consequenceNote: consequence,
    stateUpdates: {
      hpChange: hpDelta,
      manaChange: manaDelta,
      goldChange: goldDelta,
      receivedItem: (turnCount === 2) ? {
        id: 'item_04_silver_dagger',
        name: 'Belati Perak Berukir Rune',
        category: 'Senjata',
        effect: '+2 Bonus Serangan Rahasia',
        icon: 'item_04_silver_dagger'
      } : null,
      consumedItem: null,
      addLedgerFact: `Melakukan '${actionText.slice(0, 35)}' dan tiba di ${chosenLoc.loc}.`
    },
    choices: [
      {
        id: `c_${turnCount}_1`,
        text: `Manfaatkan momentum dari "${actionText.slice(0, 30)}" untuk merangsek lebih jauh ke dalam`,
        tone: 'bold'
      },
      {
        id: `c_${turnCount}_2`,
        text: `Gali informasi lebih dalam dari ${chosenLoc.spk} mengenai ancaman yang mengintai`,
        tone: 'curious'
      },
      {
        id: `c_${turnCount}_3`,
        text: `Siapkan posisi bertahan dan amankan rute evakuasi di sekitar ${chosenLoc.loc}`,
        tone: 'cautious'
      }
    ]
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
      'gemini-3.6-flash',
      'gemini-3.5-flash'
    ].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);

    let lastError = null;
    for (const model of candidateModels) {
      try {
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
          setTimeout(() => reject(new Error(`Timeout: Model ${model} took longer than 5000ms`)), 5000)
        );

        const response = await Promise.race([generatePromise, timeoutPromise]);

        if (response && response.text) {
          return response.text.trim();
        }
      } catch (err) {
        lastError = err;
        console.warn(`[GeminiService] Model '${model}' call failed (${err.message}). Cascading to next candidate...`);
      }
    }

    throw lastError || new Error('All candidate models failed');
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
3. backgroundId WAJIB dipilih dari daftar resmi berikut sesuai suasana dan lokasi:
   bg_01_tavern, bg_02_cursed_woods, bg_03_sunken_citadel, bg_04_crimson_crypt, bg_05_vampire_castle, bg_06_alchemy_lab, bg_07_smuggler_cave, bg_08_arcane_library, bg_09_dragon_crater,
   bg_10_ancient_ruins, bg_11_throne_room, bg_12_underdark_cavern, bg_13_lava_forge, bg_14_frost_peak, bg_15_haunted_graveyard, bg_16_swamp_huts, bg_17_desert_temple, bg_18_celestial_sanctum, bg_19_shadowfell_citadel,
   bg_20_pirate_ship_deck, bg_21_goblin_war_camp, bg_22_crystal_mines, bg_23_dungeon_torture_chamber, bg_24_feywild_glade, bg_25_abandoned_cathedral, bg_26_clockwork_vault, bg_27_dragon_hoard, bg_28_city_market_alley, bg_29_abyssal_rift.
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
    "manaChange": 0,
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
      return parseSceneJson(await this.callWithFallback(prompt, systemPrompt));
    } catch (err) {
      console.warn('[GeminiService] Error calling Gemini API for opening, using deterministic fallback:', err.message);
      return getFallbackOpening(campaign, character);
    }
  }

  async generateNextScene({ session, character, previousNode, actionTaken, checkResult }) {
    if (!this.client) {
      return getFallbackNextScene(previousNode, actionTaken, checkResult, character, session?.turnCount || 1);
    }

    const ledgerFacts = session?.worldLedger?.questFlags 
      ? Object.values(session.worldLedger.questFlags).join('. ') 
      : 'Belum ada catatan petualangan khusus.';

    const prevLocation = previousNode?.location || 'Ruang Petualangan';
    const prevSpeaker = previousNode?.speaker || 'Narator';
    const prevDialogue = previousNode?.dialogueText || '';
    const actionText = actionTaken?.text || 'Melangkah maju dengan waspada';
    const actionTone = actionTaken?.tone || 'cautious';

    const activeCombat = previousNode?.combatEncounter;
    const combatContext = activeCombat ? `
[PERTEMPURAN AKTIF SEDANG BERLANGSUNG]:
- Musuh: ${activeCombat.enemyName} (HP Musuh: ${activeCombat.enemyHp}/${activeCombat.maxEnemyHp})
- ATURAN PERTEMPURAN:
  * Jika pemain menyerang atau merapal sihir, hitung dampak damage ke musuh (10 s.d 25 damage).
  * Jika musuh kalah (HP <= 0), narasikan kekalahan musuh, berikan reward koin gold/item pada stateUpdates, dan set 'combatEncounter': null.
  * Jika musuh belum kalah, narasikan serangan balasan musuh (-HP pemain di 'hpChange') dan perbarui sisa HP musuh di 'combatEncounter'.
  * Jika pemain kabur, narasikan pelarian dan set 'combatEncounter': null.
` : '';

    const systemPrompt = `Kamu adalah Dungeon Master (DM) legendaris untuk game Visual Novel RPG Tabletop.
TUGAS UTAMA: Menulis adegan narasi berikutnya yang SEPENUHNYA TANGGAP dan REAKTIF terhadap aksi pemain.

KONTEKS DUNIA SAAT INI:
- Lokasi Terakhir: ${prevLocation}
- Pembicara / Karakter Terakhir: ${prevSpeaker}
- Narasi Situasi Sebelumnya: "${prevDialogue}"
- Karakter Pemain: ${character.name} (Kelas: ${character.characterClass}, HP: ${character.hp}/${character.maxHp}, Mana: ${character.mana}/${character.maxMana})
- Catatan Petualangan Sebelumnya: ${ledgerFacts}
${combatContext}

TINDAKAN YANG DIPILIH PEMAIN:
Aksi: "${actionText}"
Nada Tindakan: ${actionTone}

ATURAN REAKTIVITAS KONSEKUENSI (SANGAT KRUSIAL):
1. RESPON PARAGRAF PERTAMA WAJIB LANGSUNG: Kalimat dan paragraf pertama 'dialogue' HARUS SECARA LANGSUNG menceritakan bagaimana karakter mengeksekusi aksi "${actionText}" dan apa dampak instan yang terjadi seketika di lokasi. DILARANG KERAS mengabaikan aksi ini atau melompat ke peristiwa lain tanpa menceritakan hasilnya terlebih dahulu!
2. KONSEKUENSI NYATA ('consequenceNote'): Tulis ringkasan padat dampak langsung aksi pemain tersebut. (Contoh: "Pintu rahasia berhasil dibuka", "Musuh terkejut oleh serangan tiba-tiba", "Relik tersembunyi berhasil ditemukan"). JANGAN gunakan teks generik seperti "Langkah baru diambil."!
3. PENGURANGAN MANA SIHIR: Jika aksi pemain menggunakan mantra/sihir (misal Fireball, teleport, hembusan energi), kurangi Mana pemain secara proporsional (-4 s.d -12) di 'manaChange' dalam 'stateUpdates'.
4. JANGAN PERNAH GUNAKAN EM DASH (—). Gunakan koma, titik dua, atau kurung.
5. TANPA SISTEM DADU: Evaluasi aksi secara logis. Jika aksinya kreatif dan masuk akal, buat berhasil dan berikan hadiah gold/item bila layak. Jika aksinya berbahaya, berikan pengurangan HP masuk akal (misal: hpChange: -4).
6. BAHAYA MAUT / TINDAKAN FATAL: Jika aksi pemain adalah tindakan ceroboh atau mematikan (seperti melompat ke kawah lahar, terjun ke jurang tanpa perlindungan, menenggak racun maut, menusuk diri sendiri), wajib berikan pengurangan HP fatal (-15 s.d -30) pada 'hpChange' dalam 'stateUpdates', dan narasikan luka bakar dahsyat atau kepedihan fisik yang dialami karakter.
7. PILIHAN TINDAKAN BERIKUTNYA ('choices'): Sediakan 3 pilihan aksi baru yang secara runtut dan logis merupakan kelanjutan situasi setelah aksi "${actionText}" tersebut selesai terjadi.
8. Respon WAJIB berupa objek JSON murni tanpa pembungkus \`\`\`json.

SKEMA JSON RESMI:
{
  "chapterTitle": "string",
  "location": "string",
  "backgroundId": "string (pilih salah satu dari bg_01 s.d bg_29)",
  "speaker": "string (nama NPC atau Narator)",
  "characterId": "string (char_hero_01 s.d 09 atau char_npc_01 s.d 09)",
  "mood": "tense | mysterious | triumphant | ominous | peaceful",
  "dialogue": "string narasi mendalam yang langsung menjawab dampak aksi pemain",
  "consequenceNote": "string ringkas dampak aksi pemain",
  "stateUpdates": {
    "hpChange": 0,
    "manaChange": 0,
    "goldChange": 0,
    "receivedItem": null,
    "consumedItem": null,
    "addLedgerFact": "string ringkas tindakan dan dampaknya untuk memori DM"
  },
  "combatEncounter": null,
  "choices": [
    {
      "id": "c1",
      "text": "string opsi aksi lanjutan",
      "tone": "bold | cautious | curious | shrewd"
    },
    {
      "id": "c2",
      "text": "string opsi aksi lanjutan",
      "tone": "bold | cautious | curious | shrewd"
    },
    {
      "id": "c3",
      "text": "string opsi aksi lanjutan",
      "tone": "bold | cautious | curious | shrewd"
    }
  ]
}`;

    const prompt = `Lanjutkan petualangan sekarang! Aksi pemain yang baru saja dilakukan: "${actionText}". Ceritakan dampak langsungnya pada situasi!`;

    try {
      return parseSceneJson(await this.callWithFallback(prompt, systemPrompt));
    } catch (err) {
      console.warn('[GeminiService] Error calling Gemini API for next scene, using smart contextual fallback:', err.message);
      return getFallbackNextScene(previousNode, actionTaken, checkResult, character, session?.turnCount || 1);
    }
  }
}

module.exports = new GeminiService();

