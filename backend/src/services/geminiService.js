const { GoogleGenAI } = require('@google/genai');
const { z } = require('zod');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const choiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  requiredItem: z.string().nullable().optional(),
  tone: z.string().optional(),
  statType: z.string().optional(),
  dc: z.number().optional()
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

  let dialogue = '';
  if (campaign?.introDialogue) {
    dialogue = `${campaign.introDialogue}\n\nDi hadapanmu, ${charName} sang ${charClass}, takdir kini memanggil untuk bertindak.`;
  } else if (campaign?.premise) {
    dialogue = `${campaign.premise}\n\n${charName}, petualang ${charClass} yang tangguh, kini berdiri di ambang misteri ini.`;
  } else {
    dialogue = `Selamat datang di ${title}, ${charName}. Petualangan epikmu baru saja dimulai.`;
  }

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
    chapterTitle: `Babak I: ${title}`,
    location,
    backgroundId: bgId,
    speaker,
    characterId: npcId,
    mood: 'mysterious',
    dialogue: cleanText(dialogue),
    consequenceNote: `Memulai babak pertama kampanye ${title}.`,
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
        tone: 'cautious',
        statType: 'WIS',
        dc: 10
      },
      {
        id: 'c2',
        text: 'Melangkah maju mendekati sumber suara atau sosok di hadapanmu',
        tone: 'bold',
        statType: 'STR',
        dc: 12
      },
      {
        id: 'c3',
        text: 'Selidiki ornamen dan energi gaib yang terpancar di sekitar tempat ini',
        tone: 'curious',
        statType: 'INT',
        dc: 11
      }
    ]
  };
}

function getFallbackNextScene(previousNode, actionTaken, checkResult, character, turnCount = 1) {
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

  // Spatial Anchoring: Preserve current location & background unless player explicitly travels
  const travelKeywords = ['pindah', 'keluar', 'masuk', 'portal', 'gerbang', 'lorong', 'jalan', 'menuju', 'tinggalkan', 'pergi', 'telusuri', 'menjelajah'];
  const isTravel = travelKeywords.some(k => lowerAction.includes(k));

  let chosenLoc = {
    title: previousNode?.chapterTitle ? `${previousNode.chapterTitle} (Lanjutan)` : 'Eksplorasi Ruangan',
    loc: prevLoc,
    bg: previousNode?.backgroundId || 'bg_01_tavern',
    spk: prevSpk,
    char: previousNode?.characterId || 'char_npc_01_barkeep',
    mood: previousNode?.mood || 'mysterious'
  };

  if (isTravel) {
    const locIdx = Math.min(locations.length - 1, Math.max(0, turnCount % locations.length));
    chosenLoc = locations[locIdx];
  }

  let consequence = '';
  let outcomeDialogue = '';
  let hpDelta = 0;
  let manaDelta = 0;
  let goldDelta = 0;

  // D&D 5E Dice Check Integration
  let dicePrefix = '';
  if (checkResult) {
    if (checkResult.isNat20) {
      dicePrefix = '[D20: NATURAL 20 CRITICAL SUCCESS!] ';
      goldDelta += 15;
    } else if (checkResult.isNat1) {
      dicePrefix = '[D20: NATURAL 1 CRITICAL FAILURE!] ';
      hpDelta -= 5;
    } else if (checkResult.isSuccess) {
      dicePrefix = `[D20: SUKSES (${checkResult.total} vs DC ${checkResult.dc})] `;
    } else {
      dicePrefix = `[D20: GAGAL (${checkResult.total} vs DC ${checkResult.dc})] `;
      hpDelta -= 2;
    }
  }

  if (lowerAction.includes('sihir') || lowerAction.includes('mantra') || lowerAction.includes('spell') || lowerAction.includes('fireball') || lowerAction.includes('arkana')) {
    manaDelta = -6;
  }

  const lethalKeywords = ['lahar', 'magma', 'kawah', 'racun', 'jurang', 'bunuh diri', 'terjun', 'tanpa perlindungan'];
  const isLethal = lethalKeywords.some(k => lowerAction.includes(k));

  if (isLethal) {
    hpDelta = -25;
    consequence = `${dicePrefix}Dampak fatal: Aksi ceroboh menerjang bahaya maut mengakibatkan luka parah dan kehancuran fisik!`;
    outcomeDialogue = `Kamu nekat memutuskan untuk: "${actionText}". Tanpa perlindungan memadai, kobaran bahaya mematikan seketika melalap tubuhmu, membakar daging dan meremukkan daya tahan ragamu hingga ke batas maut!`;
  } else if (lowerAction.includes('serang') || lowerAction.includes('tebas') || lowerAction.includes('kekuatan') || lowerAction.includes('hantam') || actionTone === 'bold') {
    consequence = `${dicePrefix}Dampak: Aksi fisik berhasil menembus hambatan.`;
    outcomeDialogue = `Kamu memutuskan untuk: "${actionText}". Dengan pengerahan tenaga penuh, langkah agresifmu membuahkan hasil nyata, meremukkan rintangan dan membuka celah di ${chosenLoc.loc}. ${chosenLoc.spk} memperhatikan tekadmu yang tak gentar.`;
    goldDelta = Math.max(goldDelta, 10);
  } else if (lowerAction.includes('selidiki') || lowerAction.includes('manuskrip') || lowerAction.includes('simbol') || lowerAction.includes('amati') || actionTone === 'curious') {
    consequence = `${dicePrefix}Dampak: Pengamatan cermat berhasil mengungkap rahasia tersembunyi.`;
    outcomeDialogue = `Kamu memfokuskan perhatian untuk: "${actionText}". Matamu yang jeli mendapati petunjuk penting yang terselubung bayang-bayang di ${chosenLoc.loc}. ${chosenLoc.spk} tersenyum tipis mengakui ketajaman firasatmu.`;
    goldDelta = Math.max(goldDelta, 15);
  } else if (lowerAction.includes('waspada') || lowerAction.includes('sembunyi') || lowerAction.includes('senyap') || lowerAction.includes('mundur') || actionTone === 'cautious') {
    consequence = `${dicePrefix}Dampak: Kewaspadaan tinggi berhasil melindungimu dari sergapan.`;
    outcomeDialogue = `Kamu melangkah dengan sangat berhati-hati untuk: "${actionText}". Naluri bertahan hidupmu terbukti tepat, kamu berhasil membaca pergerakan lawan di ${chosenLoc.loc} tanpa terluka.`;
  } else {
    consequence = `${dicePrefix}Dampak: Keputusanmu langsung mengubah situasi di sekelilingmu.`;
    outcomeDialogue = `Kamu segera mengambil keputusan untuk: "${actionText}". Tindakan tegas tersebut seketika memecah ketegangan di ${chosenLoc.loc}, membuat ${chosenLoc.spk} harus menyesuaikan sikapnya terhadap keberadaanmu.`;
    goldDelta = Math.max(goldDelta, 5);
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
        text: `Manfaatkan momentum dari "${actionText.slice(0, 30)}" untuk merangsek lebih jauh`,
        tone: 'bold'
      },
      {
        id: `c_${turnCount}_2`,
        text: `Gali informasi lebih dalam dari ${chosenLoc.spk} mengenai situasi sekitar`,
        tone: 'curious'
      },
      {
        id: `c_${turnCount}_3`,
        text: `Siapkan posisi bertahan dan amankan rute evakuasi di ${chosenLoc.loc}`,
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
            setTimeout(() => reject(new Error(`Timeout: Model ${model} took longer than 7000ms`)), 7000)
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

    const systemPrompt = `Kamu adalah Dungeon Master (DM) legendaris untuk game Visual Novel Virtual Tabletop (VTT).
Tugasmu adalah merajut narasi interaktif D&D dengan Bahasa Indonesia sastrawi yang imersif dan atmosferik.

ATURAN WAJIB DUNGEON MASTER:
1. PERSONALISASI NAMA & ROLE/KELAS:
   Karakter pemain adalah "${charName}", bertindak sebagai seorang "${charClass}" (Ras: ${character.race || 'Human'}).
   DM dan seluruh NPC WAJIB secara personal menyapa dan memanggil nama "${charName}", serta menyesuaikan sudut pandang dan suasana adegan dengan persona dan gaya kelas ${charClass}.
2. STRUKTUR 12 STAGE KAMPANYE:
   Petualangan ini dirancang tepat dalam 12 babak/stage bertahap menuju klimaks epik. Adegan ini adalah BABAK I: Permulaan Takdir.
3. Respon WAJIB berupa objek JSON murni tanpa pembungkus markdown seperti \`\`\`json.
4. JANGAN PERNAH menggunakan karakter em dash (—). Gunakan koma, titik dua, tanda kurung, atau titik.
5. backgroundId WAJIB dipilih dari daftar resmi berikut sesuai suasana dan lokasi:
   bg_01_tavern, bg_02_cursed_woods, bg_03_sunken_citadel, bg_04_crimson_crypt, bg_05_vampire_castle, bg_06_alchemy_lab, bg_07_smuggler_cave, bg_08_arcane_library, bg_09_dragon_crater,
   bg_10_ancient_ruins, bg_11_throne_room, bg_12_underdark_cavern, bg_13_lava_forge, bg_14_frost_peak, bg_15_haunted_graveyard, bg_16_swamp_huts, bg_17_desert_temple, bg_18_celestial_sanctum, bg_19_shadowfell_citadel,
   bg_20_pirate_ship_deck, bg_21_goblin_war_camp, bg_22_crystal_mines, bg_23_dungeon_torture_chamber, bg_24_feywild_glade, bg_25_abandoned_cathedral, bg_26_clockwork_vault, bg_27_dragon_hoard, bg_28_city_market_alley, bg_29_abyssal_rift.
6. characterId WAJIB dipilih dari: char_hero_01 s.d 09 atau char_npc_01 s.d 09.
7. Evaluasi aksi pemain murni berdasarkan logika dunia fantasi dan keahlian kelasnya.

SKEMA JSON RESMI:
{
  "chapterTitle": "Babak I: [Judul Babak]",
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
Karakter Pemain: ${charName}, Ras: ${character.race}, Kelas: ${charClass}, STR: ${character.str}, DEX: ${character.dex}, INT: ${character.int}, WIS: ${character.wis}, CHA: ${character.cha}, CON: ${character.con}.
Buatlah adegan pembuka Babak I dari 12 Babak Petualangan yang sangat memukau, menyebut nama ${charName}, dan mencerminkan keahlian ${charClass}.
PENTING: Pada teks 'dialogue', sampaikan terlebih dahulu Latar Belakang Cerita (Premise) dari kampanye ini secara naratif dan epik. Setelah latar belakang cerita diceritakan dengan jelas, barulah pada paragraf berikutnya berikan naratif situasi karakter saat ini yang mendorong pemain untuk mengambil tindakan atau pilihan pertama.`;

    try {
      return parseSceneJson(await this.callWithFallback(prompt, systemPrompt));
    } catch (err) {
      console.warn('[GeminiService] Error calling Gemini API for opening, using deterministic fallback:', err.message);
      return getFallbackOpening(campaign, character);
    }
  }

  async generateNextScene({ session, character, previousNode, actionTaken, checkResult, recentHistory }) {
    if (!this.client) {
      return getFallbackNextScene(previousNode, actionTaken, checkResult, character, session?.turnCount || 1);
    }

    const ledgerFacts = session?.worldLedger?.questFlags 
      ? Object.values(session.worldLedger.questFlags).join('. ') 
      : 'Belum ada catatan petualangan khusus.';

    const prevLocation = previousNode?.location || 'Ruang Petualangan';
    const prevSpeaker = previousNode?.speaker || 'Narator';
    const prevDialogue = previousNode?.dialogueText || '';
    const prevBgId = previousNode?.backgroundId || 'bg_01_tavern';
    const actionText = actionTaken?.text || 'Melangkah maju dengan waspada';
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

    // Explicit D&D 5E Dice Audit Context
    let diceAuditContext = '';
    if (checkResult) {
      const isNat20 = checkResult.isNat20;
      const isNat1 = checkResult.isNat1;
      const isSuccess = checkResult.isSuccess;
      diceAuditContext = `
[HASIL LEMPARAN DADU D&D 5E UNTUK AKSI INI]:
- Jenis Cek Atribut: ${checkResult.statType || 'STR'}
- Angka Dadu D20: ${checkResult.roll}${checkResult.modifier !== undefined ? ` + (Mod ${checkResult.modifier}) = Total ${checkResult.total}` : ''} vs DC ${checkResult.dc}
- Status Hasil: ${isNat20 ? '⭐ NATURAL 20 - CRITICAL SUCCESS MUTLAK!' : isNat1 ? '💀 NATURAL 1 - CRITICAL FAILURE BLUNDER MUTLAK!' : isSuccess ? '✅ SUKSES' : '❌ GAGAL'}
- WAJIB DIINTEGRASIKAN KE CERITA:
  * ${isNat20 ? 'Pemain berhasil dengan cara spektakuler dan mengagumkan! Berikan dampak taktis maksimal dan hadiah tambahan.' : isNat1 ? 'Aksi pemain mengalami kecelakaan fatal, blunder konyol, atau terhambat bencana tak terduga. Berikan dampak negatif logis dan kurangi HP pemain di hpChange (-4 s.d -10).' : isSuccess ? 'Aksi pemain berhasil dengan baik dan mengatasi rintangan.' : 'Aksi pemain terhalang atau gagal menembus pertahanan/kondisi. Narasikan komplikasi situasi yang terjadi.'}
`;
    }

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
- Eksplorasi taktis, rintangan, dan penyelidikan dunia fantasi menuju misi utama.
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

    const systemPrompt = `Kamu adalah Dungeon Master (DM) legendaris untuk game Visual Novel RPG Tabletop.
TUGAS UTAMA: Menulis adegan narasi berikutnya yang SEPENUHNYA TANGGAP dan REAKTIF terhadap aksi pemain serta HASIL AUDIT DADU D&D 5E.

KONTEKS DUNIA & RIWAYAT LANGKAH SEBELUMNYA:
${historyContext}

KONDISI PEMAIN SAAT INI:
- Karakter: ${charName} (Kelas / Role: ${charClass}, Ras: ${character.race || 'Human'}, HP: ${character.hp}/${character.maxHp}, Mana: ${character.mana}/${character.maxMana}, Gold: ${character.gold})
- Lokasi Terakhir: ${prevLocation}
- Latar Aktif Saat Ini: "${prevBgId}"
- Memori Dunia: ${ledgerFacts}
- Reputasi Fraksi: ${repSummary}
${combatContext}
${diceAuditContext}
${stagePacingContext}
${offRailsInstruction}

TINDAKAN YANG DIAMBIL PEMAIN:
Aksi: "${actionText}"
Nada Tindakan: ${actionTone}

ATURAN REAKTIVITAS KONSEKUENSI & KONSISTENSI (SANGAT KRUSIAL):
1. PERSONALISASI NAMA & KELAS: Seluruh narasi dan dialog NPC WAJIB memanggil nama "${charName}", serta mencerminkan gaya bertarung dan respon indrawi kelas "${charClass}" (misal tebasan pedang zirah untuk Warrior, mantra arkanum untuk Mage, kelincahan bayangan untuk Rogue, doa suci untuk Cleric).
2. RESPON PARAGRAF PERTAMA WAJIB LANGSUNG: Kalimat dan paragraf pertama 'dialogue' HARUS SECARA LANGSUNG menceritakan bagaimana ${charName} mengeksekusi aksi "${actionText}" dan apa dampak instan yang terjadi seketika di lokasi. DILARANG KERAS mengabaikan aksi ini!
3. INTEGRASI HASIL DADU D&D 5E: Jika ada blok [HASIL LEMPARAN DADU D&D 5E], narasi keberhasilan atau kegagalan aksi pemain HARUS MENGIKUTI status hasil lemparan dadu tersebut secara jujur dan dramatis.
4. KONSISTENSI SPASIAL LOKASI (SPATIAL ANCHORING): 'backgroundId' WAJIB TETAP MENGGUNAKAN "${prevBgId}" KECUALI aksi pemain secara eksplisit adalah berpindah ruangan, keluar gedung, menembus portal, atau melakukan perjalanan ke lokasi baru.
5. KONSEKUENSI NYATA ('consequenceNote'): Tulis ringkasan padat 1 kalimat tentang dampak langsung aksi pemain tersebut.
6. PENGURANGAN MANA SIHIR: Jika aksi pemain menggunakan mantra/sihir, kurangi Mana pemain secara proporsional (-4 s.d -12) di 'manaChange' dalam 'stateUpdates'.
7. BAHAYA MAUT / TINDAKAN FATAL: Jika aksi pemain adalah tindakan ceroboh atau mematikan (seperti melompat ke kawah lahar, terjun ke jurang tanpa perlindungan), wajib berikan pengurangan HP fatal (-15 s.d -30) pada 'hpChange' dalam 'stateUpdates'.
8. PILIHAN TINDAKAN BERIKUTNYA ('choices'): Sediakan 2 sampai 3 pilihan aksi taktis baru yang RINGKAS, PADAT (maksimal 1 kalimat lugas per opsi), dan logis sebagai opsi tindak lanjut (Kecuali jika turnCount >= 11, berikan opsi penutup finish_game).
9. JANGAN PERNAH GUNAKAN EM DASH (—). Gunakan koma, titik dua, atau kurung.
10. Respon WAJIB berupa objek JSON murni tanpa pembungkus \`\`\`json.

SKEMA JSON RESMI:
{
  "chapterTitle": "string",
  "location": "string",
  "backgroundId": "string (pilih salah satu dari bg_01 s.d bg_29)",
  "speaker": "string (nama NPC atau Narator)",
  "characterId": "string (char_hero_01 s.d 09 atau char_npc_01 s.d 09)",
  "mood": "tense | mysterious | triumphant | ominous | peaceful",
  "dialogue": "string narasi mendalam yang langsung menjawab dampak aksi pemain dan hasil dadu",
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
      "text": "string opsi aksi lanjutan (singkat dan padat)",
      "tone": "bold | cautious | curious | shrewd"
    },
    {
      "id": "c2",
      "text": "string opsi aksi lanjutan (singkat dan padat)",
      "tone": "bold | cautious | curious | shrewd"
    }
  ]
}`;

    const prompt = `Lanjutkan petualangan untuk ${charName} sang ${charClass}! Aksi pemain yang baru saja dilakukan: "${actionText}". Ceritakan dampak langsungnya secara reaktif sesuai hasil dadu dan kondisi babak saat ini!`;

    try {
      return parseSceneJson(await this.callWithFallback(prompt, systemPrompt));
    } catch (err) {
      console.warn('[GeminiService] Error calling Gemini API for next scene, using smart contextual fallback:', err.message);
      return getFallbackNextScene(previousNode, actionTaken, checkResult, character, session?.turnCount || 1);
    }
  }

  // Cinematic Combat Narration Engine (Pilar 5)
  async generateCombatNarration({ character, enemy, action, rollResult, damageDealt, isHit, isCrit, isFumble, isDefeated, isPlayerDefeated }) {
    const charName = character?.name || 'Pahlawan';
    const enemyName = enemy?.name || 'Musuh';

    const defaultDescriptions = {
      attack_crit: `Dengan presisi mematikan (Natural 20!), ${charName} menemukan celah pertahanan ${enemyName} dan menghunjamkan tebasan telak sedalam ${damageDealt} damage!`,
      attack_hit: `${charName} mengayunkan senjata dengan sigap, menyayat pertahanan ${enemyName} dan menorehkan ${damageDealt} damage fisik.`,
      attack_miss: `Ayunan senjata ${charName} meleset tipis ketika ${enemyName} melompat mundur menepis serangan.`,
      attack_fumble: `Nahas! Ayunan ${charName} tersangkut di puing reruntuhan (Natural 1), membuka celah berbahaya bagi serangan balasan.`,
      spell_crit: `Ledakan magis dahsyat (Critical!) membumbung tinggi, gelombang energi meremukkan pertahanan ${enemyName} sebesar ${damageDealt} damage!`,
      spell_hit: `Kilatan energi arkanum melesat tepat sasaran, membakar pertahanan ${enemyName} sebesar ${damageDealt} damage sihir.`,
      spell_miss: `Mantra sihir berpendar liar di udara namun ${enemyName} berhasil berguling menghindar ke balik pilar.`,
      victory: `Tubuh ${enemyName} terhuyung hebat lalu ambruk ke lantai batu tanpa daya! Kemenangan mutlak bagi ${charName}!`,
      defeat: `${charName} roboh tak berdaya menahan hantaman maut ${enemyName}. Kegelapan menyelimuti medan tempur...`
    };

    if (isPlayerDefeated) return defaultDescriptions.defeat;
    if (isDefeated) return defaultDescriptions.victory;

    if (!this.client) {
      if (action === 'CAST_SPELL') {
        return isCrit ? defaultDescriptions.spell_crit : isHit ? defaultDescriptions.spell_hit : defaultDescriptions.spell_miss;
      }
      return isCrit ? defaultDescriptions.attack_crit : isFumble ? defaultDescriptions.attack_fumble : isHit ? defaultDescriptions.attack_hit : defaultDescriptions.attack_miss;
    }

    try {
      const prompt = `Tulis narasi sinematik 1 kalimat dalam Bahasa Indonesia untuk duel D&D:
Pemain: ${charName} (${character?.characterClass || 'Petualang'})
Musuh: ${enemyName}
Aksi: ${action}
Hasil: ${isCrit ? 'CRITICAL HIT (Nat 20)' : isFumble ? 'CRITICAL MISS (Nat 1)' : isHit ? `KENA (${damageDealt} dmg)` : 'MELESET'}
Status: ${isDefeated ? 'Musuh tewas' : 'Masih bertarung'}
Instruksi: Tulis HANYA 1 kalimat narasi deskriptif, atmosferik fantasi gelap, tanpa tanda kutip atau awalan.`;

      const response = await Promise.race([
        this.client.models.generateContent({
          model: this.modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout combat narration')), 3000))
      ]);

      if (response && response.text) {
        return cleanText(response.text.trim());
      }
    } catch (e) {
      // Graceful fallback
    }

    if (action === 'CAST_SPELL') {
      return isCrit ? defaultDescriptions.spell_crit : isHit ? defaultDescriptions.spell_hit : defaultDescriptions.spell_miss;
    }
    return isCrit ? defaultDescriptions.attack_crit : isFumble ? defaultDescriptions.attack_fumble : isHit ? defaultDescriptions.attack_hit : defaultDescriptions.attack_miss;
  }
}

module.exports = new GeminiService();

