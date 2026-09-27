const Item = require('../Item');
const NPC = require('../NPC');
const Location = require('../Location');
const Quest = require('../Quest');
const QuestObjective = require('../QuestObjective');

const itemsData = [
  {
    id: 'item_01_potion_heal',
    name: 'Potion of Healing',
    description: 'Ramuan herbal merah delima yang memulihkan 25 Hit Points seketika.',
    category: 'consumable',
    rarity: 'common',
    icon: 'item_01_potion_heal',
    maxStack: 10,
    isConsumable: true,
    isUsable: true,
    effectType: 'HEAL_HP',
    effectValue: 25,
    metadata: { hp: 25, mana: 0, gold: 0, sellPrice: 15, buyPrice: 30 }
  },
  {
    id: 'item_02_potion_mana',
    name: 'Celestial Mana Elixir',
    description: 'Cairan safir berkilau yang memulihkan 25 poin energi mana seketika.',
    category: 'consumable',
    rarity: 'common',
    icon: 'item_02_potion_mana',
    maxStack: 10,
    isConsumable: true,
    isUsable: true,
    effectType: 'RESTORE_MANA',
    effectValue: 25,
    metadata: { hp: 0, mana: 25, gold: 0, sellPrice: 20, buyPrice: 40 }
  },
  {
    id: 'item_03_grimoire',
    name: 'Ancient Grimoire',
    description: 'Kitab mantra bersampul kulit naga yang meningkatkan kapasitas mana dan wawasan arkana.',
    category: 'relic',
    rarity: 'rare',
    icon: 'item_03_grimoire',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_MANA',
    effectValue: 15,
    metadata: { maxManaBonus: 15, sellPrice: 100, buyPrice: 200 }
  },
  {
    id: 'item_04_silver_dagger',
    name: 'Silver Dagger',
    description: 'Belati berlapis perak tempaan Oakhaven yang efektif menembus zirah makhluk kegelapan.',
    category: 'weapon',
    rarity: 'uncommon',
    icon: 'item_04_silver_dagger',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_ATTACK',
    effectValue: 3,
    metadata: { attackBonus: 3, sellPrice: 40, buyPrice: 80 }
  },
  {
    id: 'item_05_cursed_amulet',
    name: 'Blessed Talisman',
    description: 'Amulet perak bertuliskan rune suci penangkal kutukan dan sihir ilusi.',
    category: 'amulet',
    rarity: 'rare',
    icon: 'item_05_cursed_amulet',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_DEFENSE',
    effectValue: 2,
    metadata: { wardBonus: 2, sellPrice: 50, buyPrice: 100 }
  },
  {
    id: 'item_06_skeleton_key',
    name: 'Skeleton Key',
    description: 'Kunci berukir tengkorak tembaga kuno yang mampu membuka gembok makam dan katakombe.',
    category: 'key',
    rarity: 'rare',
    icon: 'item_06_skeleton_key',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'KEY_UNLOCK',
    effectValue: 1,
    metadata: { keyType: 'crypt', sellPrice: 60, buyPrice: 120 }
  },
  {
    id: 'item_07_golden_compass',
    name: 'Golden Compass',
    description: 'Kompas emas bertatahkan safir yang selalu menunjukkan arah jalan keluar dan ruangan rahasia.',
    category: 'tool',
    rarity: 'rare',
    icon: 'item_07_golden_compass',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_WIS',
    effectValue: 2,
    metadata: { wisBonus: 2, sellPrice: 75, buyPrice: 150 }
  },
  {
    id: 'item_08_dragon_shield',
    name: 'Dragon Shield',
    description: 'Perisai kokoh berlapis sisik naga merah yang meredam benturan dan serangan elemen api.',
    category: 'shield',
    rarity: 'rare',
    icon: 'item_08_dragon_shield',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_AC',
    effectValue: 2,
    metadata: { acBonus: 2, sellPrice: 80, buyPrice: 160 }
  },
  {
    id: 'item_09_gold_pouch',
    name: 'Kantong Emas Saudagar',
    category: 'consumable',
    description: 'Kantong beludru berisi 50 keping koin emas murni kerajaan.',
    rarity: 'uncommon',
    icon: 'item_09_gold_pouch',
    maxStack: 5,
    isConsumable: true,
    isUsable: true,
    effectType: 'ADD_GOLD',
    effectValue: 50,
    metadata: { gold: 50, sellPrice: 50, buyPrice: 50 }
  },
  {
    id: 'item_10_elixir_vitality',
    name: 'Elixir of Vitality',
    description: 'Eliksir langka pemulih vitalitas penuh yang mengembalikan 50 HP dan 30 Mana.',
    category: 'consumable',
    rarity: 'rare',
    icon: 'item_10_elixir_vitality',
    maxStack: 5,
    isConsumable: true,
    isUsable: true,
    effectType: 'HEAL_ALL',
    effectValue: 50,
    metadata: { hp: 50, mana: 30, sellPrice: 45, buyPrice: 90 }
  },
  {
    id: 'item_11_flame_sword',
    name: 'Flame Sword',
    description: 'Pedang baja dengan kobaran api abadi yang menyinari ruangan dan melipatgandakan daya serang.',
    category: 'weapon',
    rarity: 'epic',
    icon: 'item_11_flame_sword',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_ATTACK',
    effectValue: 5,
    metadata: { attackBonus: 5, element: 'fire', sellPrice: 120, buyPrice: 240 }
  },
  {
    id: 'item_12_teleport_scroll',
    name: 'Gulungan Teleportasi',
    description: 'Perkamen bertuliskan sihir ruang yang memindahkan pengguna ke titik aman terdekat.',
    category: 'scroll',
    rarity: 'uncommon',
    icon: 'item_12_teleport_scroll',
    maxStack: 5,
    isConsumable: true,
    isUsable: true,
    effectType: 'ESCAPE',
    effectValue: 1,
    metadata: { escapeSuccess: true, sellPrice: 35, buyPrice: 70 }
  },
  {
    id: 'item_13_shadow_ring',
    name: 'Shadow Ring',
    description: 'Cincin obsidian yang memudarkan bayangan pengguna saat menyelinap.',
    category: 'accessory',
    rarity: 'rare',
    icon: 'item_13_shadow_ring',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_STEALTH',
    effectValue: 3,
    metadata: { stealthBonus: 3, sellPrice: 70, buyPrice: 140 }
  },
  {
    id: 'item_14_holy_water',
    name: 'Air Suci Penyelamat',
    description: 'Air suci murni yang menyucikan racun dan memulihkan 15 HP serta 15 Mana.',
    category: 'consumable',
    rarity: 'common',
    icon: 'item_14_holy_water',
    maxStack: 10,
    isConsumable: true,
    isUsable: true,
    effectType: 'PURGE_HEAL',
    effectValue: 15,
    metadata: { hp: 15, mana: 15, undeadPurge: 20, sellPrice: 25, buyPrice: 50 }
  },
  {
    id: 'item_15_lockpick_set',
    name: 'Peralatan Pembobol Kunci',
    description: 'Set jarum dan pengungkit presisi untuk membongkar gembok peti dan pintu tersembunyi.',
    category: 'tool',
    rarity: 'common',
    icon: 'item_15_lockpick_set',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_DEX',
    effectValue: 2,
    metadata: { dexBonus: 2, sellPrice: 30, buyPrice: 60 }
  },
  {
    id: 'item_16_crown_kings',
    name: 'Mahkota Raja Yang Gugur',
    description: 'Pusaka emas bertahtakan rubi yang memancarkan wibawa dan karisma kepemimpinan agung.',
    category: 'relic',
    rarity: 'legendary',
    icon: 'item_16_crown_kings',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_CHA',
    effectValue: 3,
    metadata: { chaBonus: 3, sellPrice: 250, buyPrice: 500 }
  },
  {
    id: 'item_17_dragon_horn',
    name: 'Dragon War Horn',
    description: 'Terompet tanduk naga purba yang membangkitkan keberanian sekutu dalam pertempuran sengit.',
    category: 'instrument',
    rarity: 'rare',
    icon: 'item_17_dragon_horn',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'RALLY',
    effectValue: 1,
    metadata: { rallyAllies: true, sellPrice: 150, buyPrice: 300 }
  },
  {
    id: 'item_18_meat_ration',
    name: 'Ransum Daging Pengelana',
    description: 'Daging asap kering bergizi yang memulihkan 10 HP petualang.',
    category: 'consumable',
    rarity: 'common',
    icon: 'item_18_meat_ration',
    maxStack: 20,
    isConsumable: true,
    isUsable: true,
    effectType: 'HEAL_HP',
    effectValue: 10,
    metadata: { hp: 10, mana: 0, gold: 0, sellPrice: 5, buyPrice: 10 }
  },
  {
    id: 'item_bone_dagger',
    name: 'Belati Tulang Purba',
    description: 'Belati tajam yang diasah dari fosil tulang raksasa dengan racun alami yang mengering.',
    category: 'weapon',
    rarity: 'uncommon',
    icon: 'item_bone_dagger',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_ATTACK',
    effectValue: 2,
    metadata: { attackBonus: 2, sellPrice: 15, buyPrice: 30 }
  },
  {
    id: 'item_rapier',
    name: 'Fine Duelist Rapier',
    category: 'weapon',
    description: 'Pedang anggar baja lentur yang sangat mematikan di tangan petarung lincah.',
    rarity: 'uncommon',
    icon: 'item_rapier',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_ATTACK',
    effectValue: 4,
    metadata: { attackBonus: 4, dexBonus: 1, sellPrice: 70, buyPrice: 140 }
  },
  {
    id: 'item_sea_trident',
    name: "Sea King's Trident",
    description: 'Trisula berkekuatan pasang-surut yang ditempa di kedalaman Samudra Sunken Citadel.',
    category: 'weapon',
    rarity: 'epic',
    icon: 'item_sea_trident',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'BUFF_ATTACK',
    effectValue: 6,
    metadata: { attackBonus: 6, element: 'water', sellPrice: 180, buyPrice: 360 }
  },
  {
    id: 'item_treasure_map',
    name: 'Peta Harta Karun Usang',
    description: 'Peta kulit tua yang mencatat koordinat peti simpanan di ruang terdalam katakombe.',
    category: 'quest',
    rarity: 'uncommon',
    icon: 'item_treasure_map',
    maxStack: 1,
    isConsumable: false,
    isUsable: true,
    effectType: 'LORE',
    effectValue: 1,
    metadata: { revealsLocation: true, sellPrice: 50, buyPrice: 100 }
  },
  {
    id: 'item_trophy_aether',
    name: 'Piala Kampiun Aether',
    description: 'Mahakarya piala permata simbol supremasi petualang terhebat di benua Aether.',
    category: 'quest',
    rarity: 'legendary',
    icon: 'item_04_silver_dagger',
    maxStack: 1,
    isConsumable: false,
    isUsable: false,
    effectType: 'TROPHY',
    effectValue: 100,
    metadata: { prestige: 100, sellPrice: 500, buyPrice: 1000 }
  }
];

const npcsData = [
  {
    id: 'char_npc_01_barkeep',
    campaignId: 'whispering_tavern',
    name: 'Eldrin sang Barkeep',
    title: 'Pemilik Kedai Whispering Tavern',
    description: 'Pria paruh baya bertubuh gempal dengan celemek kulit bernoda anggur dan tatapan waspada.',
    characterType: 'quest_giver',
    portraitId: 'char_npc_01_barkeep',
    defaultLocationId: 'loc_tavern_main',
    personality: 'Pragmatis, waspada, namun ramah kepada petualang yang berniat membantu kedainya.',
    background: 'Mantan petualang veteran yang menetap di Oakhaven setelah menemukan pintu katakombe terkunci di bawah gudang kedainya.',
    isActive: true
  },
  {
    id: 'char_npc_02_informant',
    campaignId: 'crypt_of_crimson',
    name: 'Informan Bayangan',
    title: 'Mata-mata Guild Pencuri',
    description: 'Sosok bertudung gelap yang selalu berbisik dari balik bayang-bayang pilar batu.',
    characterType: 'informant',
    portraitId: 'char_npc_02_informant',
    defaultLocationId: 'loc_crimson_crypt',
    personality: 'Tertutup, penuh rahasia, memperhitungkan risiko dalam setiap kata.',
    background: 'Mengetahui seluk-beluk Makam Merah dan pergerakan kultus pemanggil arwah.',
    isActive: true
  },
  {
    id: 'char_npc_03_vampire',
    campaignId: 'vampire_castle_shadows',
    name: 'Lord Cassian',
    title: 'Penguasa Kastil Bloodmere',
    description: 'Bangsawan vampir berparas pucat dengan jubah beludru merah darah dan aura aristokrat dingin.',
    characterType: 'boss',
    portraitId: 'char_npc_03_vampire',
    defaultLocationId: 'loc_vampire_castle',
    personality: 'Angkuh, tenang, memperlakukan pertempuran bagaikan permainan catur elegan.',
    background: 'Telah menguasai tebing Bloodmere selama tiga abad dan memegang rahasia kutukan darah.',
    isActive: true
  },
  {
    id: 'char_npc_04_necromancer',
    campaignId: 'crypt_of_crimson',
    name: 'Malakar sang Necromancer',
    title: 'Pemimpin Kultus Kematian Merah',
    description: 'Pria kurus berambut kelabu dengan jubah bertatahkan tulang dan tongkat arwah.',
    characterType: 'boss',
    portraitId: 'char_npc_04_necromancer',
    defaultLocationId: 'loc_crimson_crypt',
    personality: 'Fanatik, terobsesi dengan keabadian dan ritual pemanggilan jiwa purba.',
    background: 'Membongkar segel makam bangsawan kuno demi membangkitkan pasukan kerangka.',
    isActive: true
  },
  {
    id: 'char_npc_05_dryad',
    campaignId: 'cursed_woods_dryad',
    name: 'Sylvanis sang Dryad',
    title: 'Pelindung Rimba Hitam',
    description: 'Peri pohon elok dengan mahkota daun ek dan mata hijau zamrud yang memancarkan pendar alam.',
    characterType: 'ally',
    portraitId: 'char_npc_05_dryad',
    defaultLocationId: 'loc_cursed_woods',
    personality: 'Lembut namun tegas ketika kesucian hutan terancam oleh getah beracun.',
    background: 'Roh penjaga jantung hutan Aether yang memohon pertolongan demi menyelamatkan sumber air rimba.',
    isActive: true
  },
  {
    id: 'char_npc_06_goblin',
    campaignId: 'alchemy_lab_disaster',
    name: 'Pedagang Goblin Grix',
    title: 'Penyelundup Bahan Alkimia',
    description: 'Goblin lincah berompi kantong serbaguna dengan kacamata pembesar mekanik.',
    characterType: 'merchant',
    portraitId: 'char_npc_06_goblin',
    defaultLocationId: 'loc_alchemy_lab',
    personality: 'Cerdik, cepat panik bila ada ledakan, namun menghargai transaksi koin emas.',
    background: 'Menjual komponen kimia dan kunci pengaman laboratorium transmutasi Paracelsus.',
    isActive: true
  },
  {
    id: 'char_npc_07_guard',
    campaignId: 'smuggler_cave_rebellion',
    name: 'Kapten Penjaga Garrick',
    title: 'Perwira Garnisun Pelabuhan',
    description: 'Ksatria tangguh dengan zirah baja bersimbol jangkar pelabuhan dan tatapan disiplin.',
    characterType: 'ally',
    portraitId: 'char_npc_07_guard',
    defaultLocationId: 'loc_smuggler_cave',
    personality: 'Tegas, menjunjung hukum, bersedia memberi imbalan besar bagi penyelidik jujur.',
    background: 'Menyamar untuk membongkar sindikat penyelundup senjata ilegal di gua pasang-surut.',
    isActive: true
  },
  {
    id: 'char_npc_08_cultist',
    campaignId: 'abyssal_citadel',
    name: 'Pemuja Samudra Silus',
    title: 'Penjaga Gerbang Laut Dalam',
    description: 'Pria berjubah basah beraroma garam karang dengan kulit pucat berlapis sisik ikan halus.',
    characterType: 'npc',
    portraitId: 'char_npc_08_cultist',
    defaultLocationId: 'loc_sunken_citadel',
    personality: 'Mistikus laut yang berbicara dalam teka-teki pasang-surut dan gema psionik.',
    background: 'Menjaga kubah udara Reruntuhan Samudra Sunken Citadel dari penyusup permukaan.',
    isActive: true
  },
  {
    id: 'char_npc_09_lich',
    campaignId: 'abyssal_rift_endgame',
    name: 'Kaisar Tengkorak Purba',
    title: 'Penjaga Retakan Kosmik Abyssal',
    description: 'Entitas purba tak mati bermahkota bintang hampa dengan jubah melayang di atas jurang gravitasi.',
    characterType: 'boss',
    portraitId: 'char_npc_09_lich',
    defaultLocationId: 'loc_abyssal_rift',
    personality: 'Dingin, mahatahu, menganggap kehidupan fana sekadar debu di pusaran kosmik.',
    background: 'Menjaga kristal penahan retakan dimensi agar gravitasi dunia fana tidak runtuh.',
    isActive: true
  },
  {
    id: 'char_hero_01_paladin',
    campaignId: 'abandoned_cathedral_knights',
    name: 'Sir Bryan sang Paladin',
    title: 'Ksatria Ordo Perisai Putih',
    description: 'Ksatria gagah berperisai suci pembawa panji keadilan.',
    characterType: 'ally',
    portraitId: 'char_hero_01_paladin',
    defaultLocationId: 'loc_abandoned_cathedral',
    personality: 'Pemberani, berjiwa ksatria, pantang menyerah.',
    background: 'Mencari arwah rekan ksatrianya yang gugur di katedral tua terbengkalai.',
    isActive: true
  },
  {
    id: 'char_hero_02_ranger',
    campaignId: 'frost_peak_survival',
    name: 'Lyra sang Pemandu Rimba',
    title: 'Pemburu Salju Pegunungan',
    description: 'Wanita pemanah berbusur cemara dengan mantel bulu serigala es tebal.',
    characterType: 'ally',
    portraitId: 'char_hero_02_ranger',
    defaultLocationId: 'loc_frost_peak',
    personality: 'Tenang, fokus, memahami arah angin dan jejak hewan buas.',
    background: 'Memimpin jalur penyelamatan logistik pengembara di puncak badai es Frost Peak.',
    isActive: true
  },
  {
    id: 'char_hero_03_wizard',
    campaignId: 'arcane_library_incursion',
    name: 'Master Cedric sang Wizard',
    title: 'Pustakawan Bintang Agung',
    description: 'Penyihir berjanggut perak dengan jubah biru bersulam rasi bintang.',
    characterType: 'ally',
    portraitId: 'char_hero_03_wizard',
    defaultLocationId: 'loc_arcane_library',
    personality: 'Bijaksana, teliti, mencintai pengetahuan kuno di atas segalanya.',
    background: 'Berusaha menyegel kembali Grimoire Terlarang yang terbuka di aula perpustakaan agung.',
    isActive: true
  },
  {
    id: 'char_hero_04_dwarf',
    campaignId: 'underdark_crystal_echoes',
    name: 'Torin sang Kurcaci Tambang',
    title: 'Mandor Tambang Safir Underdark',
    description: 'Kurcaci kekar berbaju zirah tembaga dengan palu tambang seberat batu karang.',
    characterType: 'ally',
    portraitId: 'char_hero_04_dwarf',
    defaultLocationId: 'loc_underdark_cavern',
    personality: 'Keras kepala namun sangat setia kawan.',
    background: 'Menyelidiki runtuhnya lorong tambang nomor empat akibat getaran kristal misterius.',
    isActive: true
  },
  {
    id: 'char_hero_05_rogue',
    campaignId: 'clockwork_vault_heist',
    name: 'Vaelen sang Pencuri Bayangan',
    title: 'Spesialis Pembobol Kunci Mekanik',
    description: 'Pria bertopeng separuh dengan jubah fleksibel penuh saku peralatan rahasia.',
    characterType: 'ally',
    portraitId: 'char_hero_05_rogue',
    defaultLocationId: 'loc_clockwork_vault',
    personality: 'Cepat tanggap, percaya diri, menyukai tantangan mekanisme gembok rumit.',
    background: 'Direkrut untuk membongkar brankas kuno bank kota sebelum sistem alarm merusak roda gigi intinya.',
    isActive: true
  },
  {
    id: 'char_hero_06_cleric',
    campaignId: 'whispering_tavern',
    name: 'Sister Althea sang Cleric',
    title: 'Pendeta Cahaya Oakhaven',
    description: 'Pendeta wanita berpakaian putih gading dengan lambang matahari fajar.',
    characterType: 'ally',
    portraitId: 'char_hero_06_cleric',
    defaultLocationId: 'loc_tavern_main',
    personality: 'Penuh empati, menenangkan orang yang ketakutan, ahli dalam penyembuhan luka jiwa dan raga.',
    background: 'Sering singgah di kedai Whispering Tavern untuk merawat musafir yang terluka.',
    isActive: true
  },
  {
    id: 'char_hero_07_warlock',
    campaignId: 'shadowfell_citadel_despair',
    name: 'Malakor sang Warlock',
    title: 'Penyelidik Dimensi Shadowfell',
    description: 'Penyihir berbusana ungu kelam dengan lambang mata bercahaya di telapak tangannya.',
    characterType: 'ally',
    portraitId: 'char_hero_07_warlock',
    defaultLocationId: 'loc_shadowfell_citadel',
    personality: 'Kalkulatif, sinis, namun memiliki komitmen kuat menjaga batas antar-dimensi.',
    background: 'Mempelajari cara menstabilkan retakan dimensi yang menelan benteng perbatasan.',
    isActive: true
  },
  {
    id: 'char_hero_08_dragonborn',
    campaignId: 'dragon_crater_summit',
    name: 'Ignis sang Dragonborn',
    title: 'Prajurit Pemburu Naga Gunung Api',
    description: 'Ksatria bertubuh raksasa bersisik merah dengan napas hangat bercampur bara api.',
    characterType: 'ally',
    portraitId: 'char_hero_08_dragonborn',
    defaultLocationId: 'loc_dragon_crater',
    personality: 'Gagah perkasa, menjunjung kehormatan darah naga, tidak gentar menghadapi hawa panas kaldera.',
    background: 'Memandu tim pendaki menuju sarang kawah naga merah purba Vermithrax.',
    isActive: true
  },
  {
    id: 'char_hero_09_bard',
    campaignId: 'feywild_twilight_glade',
    name: 'Finnian sang Penyair Pengelana',
    title: 'Pemetik Senar Feywild',
    description: 'Pemuda berbusana warna-warni dengan mandolin bersuara merdu dan senyum ramah.',
    characterType: 'ally',
    portraitId: 'char_hero_09_bard',
    defaultLocationId: 'loc_feywild_glade',
    personality: 'Ceria, berjiwa seni bebas, mampu menenangkan makhluk fey melalui alunan balada.',
    background: 'Mencari pelancong yang tersesat di dalam lingkaran ilusi waktu peri musim semi.',
    isActive: true
  }
];

const locationsData = [
  { id: 'loc_tavern_main', campaignId: 'whispering_tavern', name: 'Kedai Whispering Tavern', backgroundId: 'bg_01_tavern', description: 'Aula utama kedai kayu dengan tungku perapian hangat dan aroma bir gandum.', locationType: 'interior' },
  { id: 'loc_tavern_cellar', campaignId: 'whispering_tavern', name: 'Gudang Bawah Tanah Kedai', backgroundId: 'bg_01_tavern', description: 'Ruang bawah tanah kedai penuh tumpukan tong anggur dan lorong katakombe rahasia.', locationType: 'dungeon' },
  { id: 'loc_cursed_woods', campaignId: 'cursed_woods_dryad', name: 'Rimba Hitam Sylvanis', backgroundId: 'bg_02_cursed_woods', description: 'Hutan lebat berkabut gelap dengan pepohonan ek tua yang meneteskan getah beracun.', locationType: 'wilderness' },
  { id: 'loc_sunken_citadel', campaignId: 'abyssal_citadel', name: 'Kubah Samudra Sunken Citadel', backgroundId: 'bg_03_sunken_citadel', description: 'Reruntuhan kuil palung samudra berkubah udara dengan pilar pualam berhias anemon hijau.', locationType: 'underwater' },
  { id: 'loc_crimson_crypt', campaignId: 'crypt_of_crimson', name: 'Altar Makam Merah Darah', backgroundId: 'bg_04_crimson_crypt', description: 'Lorong makam batu basah dengan sarkofagus kuno dan altar pemanggilan jiwa.', locationType: 'catacomb' },
  { id: 'loc_vampire_castle', campaignId: 'vampire_castle_shadows', name: 'Aula Tahta Kastil Bloodmere', backgroundId: 'bg_05_vampire_castle', description: 'Kastil batu megah di puncak tebing karang berkarpet beludru merah gelap.', locationType: 'castle' },
  { id: 'loc_alchemy_lab', campaignId: 'alchemy_lab_disaster', name: 'Laboratorium Alkemis Paracelsus', backgroundId: 'bg_06_alchemy_lab', description: 'Menara alkimia dengan tungku tembaga berasap hijau pekat dan pecahan tabung reaksi.', locationType: 'interior' },
  { id: 'loc_smuggler_cave', campaignId: 'smuggler_cave_rebellion', name: 'Gua Karang Pasang Surut', backgroundId: 'bg_07_smuggler_cave', description: 'Gua pesisir pantai dengan tumpukan peti senjata penyelundup dan deburan ombak memantul.', locationType: 'cave' },
  { id: 'loc_arcane_library', campaignId: 'arcane_library_incursion', name: 'Perpustakaan Bintang Agung', backgroundId: 'bg_08_arcane_library', description: 'Aula bertingkat tinggi dengan rak buku perkamen kuno berputar dalam energi sihir liar.', locationType: 'library' },
  { id: 'loc_dragon_crater', campaignId: 'dragon_crater_summit', name: 'Kawah Kaldera Ignis Peak', backgroundId: 'bg_09_dragon_crater', description: 'Tebing batuan vulkanik berselimut hawa panas lahar mendidih tempat sarang naga Vermithrax.', locationType: 'volcano' },
  { id: 'loc_ancient_ruins', campaignId: 'whispering_tavern', name: 'Reruntuhan Katakombe Kuno', backgroundId: 'bg_10_ancient_ruins', description: 'Ruang batu bertatahkan relief purba yang terhubung ke lorong rahasia kedai.', locationType: 'dungeon' },
  { id: 'loc_throne_room', campaignId: 'vampire_castle_shadows', name: 'Kamar Tertutup Lord Cassian', backgroundId: 'bg_11_throne_room', description: 'Ruang tahta pribadi dengan jendela kaca patri gothic dan peti tidur bangsawan.', locationType: 'interior' },
  { id: 'loc_underdark_cavern', campaignId: 'underdark_crystal_echoes', name: 'Lorong Kristal Underdark Nomor Empat', backgroundId: 'bg_12_underdark_cavern', description: 'Terowongan tambang bawah tanah berhias jamur biru menyala dan kristal safir beresonansi.', locationType: 'subterranean' },
  { id: 'loc_lava_forge', campaignId: 'dragon_crater_summit', name: 'Tempaan Lahar Kuno', backgroundId: 'bg_13_lava_forge', description: 'Ruang peleburan bijih pusaka yang dialiri lahar cair abadi.', locationType: 'interior' },
  { id: 'loc_frost_peak', campaignId: 'frost_peak_survival', name: 'Pondok Pengungsian Frost Peak', backgroundId: 'bg_14_frost_peak', description: 'Lereng es curam bersalju tebal dengan pondok batu pelindung badai es beku.', locationType: 'mountain' },
  { id: 'loc_haunted_graveyard', campaignId: 'crypt_of_crimson', name: 'Makam Nisan Berkabut', backgroundId: 'bg_15_haunted_graveyard', description: 'Pemakaman luar makam merah dengan batu nisan miring dan bayangan arwah gentayangan.', locationType: 'graveyard' },
  { id: 'loc_swamp_huts', campaignId: 'swamp_witch_coven', name: 'Pondok Panggung Nenek Sihir Rawa', backgroundId: 'bg_16_swamp_huts', description: 'Pondok kayu lapuk di pedalaman rawa air payau beraroma ramuan herba pekat.', locationType: 'swamp' },
  { id: 'loc_desert_temple', campaignId: 'whispering_tavern', name: 'Kuil Pasir Waktu', backgroundId: 'bg_17_desert_temple', description: 'Kuil padang pasir dengan pilar megah penjaga rahasia peradaban hilang.', locationType: 'temple' },
  { id: 'loc_celestial_sanctum', campaignId: 'abyssal_rift_endgame', name: 'Pemberhentian Cahaya Langit', backgroundId: 'bg_18_celestial_sanctum', description: 'Kubah bercahaya emas tempat para dewa mengamati keseimbangan antar-dimensi.', locationType: 'sanctuary' },
  { id: 'loc_shadowfell_citadel', campaignId: 'shadowfell_citadel_despair', name: 'Benteng Perbatasan Shadowfell', backgroundId: 'bg_19_shadowfell_citadel', description: 'Serambi benteng batu abu-abu monokromatik di bawah naungan kabut kehampaan.', locationType: 'fortress' },
  { id: 'loc_pirate_ship_deck', campaignId: 'smuggler_cave_rebellion', name: 'Geladak Kapal Karavel Penyelundup', backgroundId: 'bg_20_pirate_ship_deck', description: 'Kapal layar pembawa muatan gelap yang bersandar diam-diam di teluk tersembunyi.', locationType: 'ship' },
  { id: 'loc_goblin_war_camp', campaignId: 'goblin_war_siege', name: 'Barikade Kayu Perkemahan Goblin', backgroundId: 'bg_21_goblin_war_camp', description: 'Kubu pertahanan pagar kayu runcing dengan pos intai goblin bersenjata panah api.', locationType: 'camp' },
  { id: 'loc_crystal_mines', campaignId: 'singing_crystal_mines', name: 'Urat Kristal Safir Berdengung', backgroundId: 'bg_22_crystal_mines', description: 'Dinding gua kristal safir yang bergetar memancarkan nada resonansi tinggi.', locationType: 'mines' },
  { id: 'loc_torture_chamber', campaignId: 'torture_chamber_escape', name: 'Penjara Bawah Tanah Benteng Inkuisisi', backgroundId: 'bg_23_dungeon_torture_chamber', description: 'Sel bawah tanah berjeruji besi tebal dengan lentera minyak berkedip temaram.', locationType: 'dungeon' },
  { id: 'loc_feywild_glade', campaignId: 'feywild_twilight_glade', name: 'Padang Peri Feywild Twilight', backgroundId: 'bg_24_feywild_glade', description: 'Padang rumput keemasan beraroma bunga liar dengan ilusi lingkaran batu peri.', locationType: 'feywild' },
  { id: 'loc_abandoned_cathedral', campaignId: 'abandoned_cathedral_knights', name: 'Serambi Katedral Terbengkalai', backgroundId: 'bg_25_abandoned_cathedral', description: 'Katedral tua dengan atap runtuh disinari cahaya bulan perak menembus kaca patri.', locationType: 'cathedral' },
  { id: 'loc_clockwork_vault', campaignId: 'clockwork_vault_heist', name: 'Bilik Brankas Mekanik Roda Gigi', backgroundId: 'bg_26_clockwork_vault', description: 'Ruang brankas bawah tanah penuh pipa uap desis dan silinder kunci bernomor romawi.', locationType: 'vault' },
  { id: 'loc_dragon_hoard', campaignId: 'dragon_crater_summit', name: 'Timbunan Harta Karun Vermithrax', backgroundId: 'bg_27_dragon_hoard', description: 'Celah kubah kawah yang dipenuhi koin emas purba dan perisai para pahlawan terdahulu.', locationType: 'lair' },
  { id: 'loc_abyssal_rift', campaignId: 'abyssal_rift_endgame', name: 'Bibir Jurang Retakan Abyssal', backgroundId: 'bg_29_abyssal_rift', description: 'Tepi tebing retakan ruang angkasa terbuka dengan pusaran gravitasi energi ungu kosmik.', locationType: 'rift' }
];

const questsData = [
  {
    id: 'quest_whispering_tavern_main',
    campaignId: 'whispering_tavern',
    title: 'Misteri Ketukan Kedai Whispering Tavern',
    description: 'Ungkap rahasia ketukan dari balik tumpukan tong anggur di gudang bawah tanah kedai Oakhaven.',
    type: 'main',
    status: 'active',
    priority: 1,
    targetLocationId: 'loc_tavern_main',
    objectives: [
      {
        id: 'obj_tavern_investigate',
        description: 'Bicaralah dengan Eldrin sang Barkeep dan periksa tumpukan tong anggur di gudang bawah tanah.',
        objectiveType: 'INVESTIGATE',
        targetId: 'char_npc_01_barkeep',
        requiredCount: 1,
        sequence: 1
      },
      {
        id: 'obj_tavern_find_catacomb',
        description: 'Temukan jalan masuk rahasia menuju katakombe kuno di balik dinding batu kedai.',
        objectiveType: 'EXPLORE',
        targetId: 'loc_tavern_cellar',
        requiredCount: 1,
        sequence: 2
      },
      {
        id: 'obj_tavern_resolve_threat',
        description: 'Amankan katakombe kuno dan kembalikan kedamaian di kedai Whispering Tavern.',
        objectiveType: 'DEFEAT',
        targetId: 'loc_ancient_ruins',
        requiredCount: 1,
        sequence: 3
      }
    ]
  },
  {
    id: 'quest_crypt_of_crimson_main',
    campaignId: 'crypt_of_crimson',
    title: 'Pembersihan Makam Merah Darah',
    description: 'Hentikan patroli kerangka penjaga dan gagalkan ritual pemanggilan arwah Malakar sang Necromancer.',
    type: 'main',
    status: 'active',
    priority: 1,
    targetLocationId: 'loc_crimson_crypt',
    objectives: [
      {
        id: 'obj_crypt_enter',
        description: 'Masuk melewati barikade gerbang Makam Merah Darah bersama Informan Bayangan.',
        objectiveType: 'TALK',
        targetId: 'char_npc_02_informant',
        requiredCount: 1,
        sequence: 1
      },
      {
        id: 'obj_crypt_stop_patrol',
        description: 'Hentikan patroli kerangka penjaga di koridor altar makam.',
        objectiveType: 'DEFEAT',
        targetId: 'loc_crimson_crypt',
        requiredCount: 1,
        sequence: 2
      },
      {
        id: 'obj_crypt_disrupt_ritual',
        description: 'Gagalkan ritual Kultus Kematian Merah dan pasang segel suci pada sarkofagus utama.',
        objectiveType: 'DEFEAT',
        targetId: 'char_npc_04_necromancer',
        requiredCount: 1,
        sequence: 3
      }
    ]
  },
  {
    id: 'quest_vampire_castle_main',
    campaignId: 'vampire_castle_shadows',
    title: 'Penaklukan Tahta Darah Kastil Bloodmere',
    description: 'Tembus gerbang kastil di puncak tebing karang dan hadapi Lord Cassian untuk mengakhiri teror bangsawan vampir.',
    type: 'main',
    status: 'active',
    priority: 1,
    targetLocationId: 'loc_vampire_castle',
    objectives: [
      {
        id: 'obj_castle_breach',
        description: 'Tembus gerbang luar Kastil Bloodmere menuju aula karpet beludru merah.',
        objectiveType: 'EXPLORE',
        targetId: 'loc_vampire_castle',
        requiredCount: 1,
        sequence: 1
      },
      {
        id: 'obj_castle_rescue',
        description: 'Temukan petunjuk keberadaan pemuda desa yang diculik di ruang bawah tanah kastil.',
        objectiveType: 'INVESTIGATE',
        targetId: 'loc_throne_room',
        requiredCount: 1,
        sequence: 2
      },
      {
        id: 'obj_castle_confront_lord',
        description: 'Konfrontasi Lord Cassian dan musnahkan pengaruh kutukan darah selamanya.',
        objectiveType: 'DEFEAT',
        targetId: 'char_npc_03_vampire',
        requiredCount: 1,
        sequence: 3
      }
    ]
  }
];

async function seedWorldData() {
  // 1. Seed Items
  for (const item of itemsData) {
    await Item.upsert(item);
  }
  console.log(`[WorldDataSeeder] Synced ${itemsData.length} items to database.`);

  // 2. Seed Locations
  for (const loc of locationsData) {
    await Location.upsert(loc);
  }
  console.log(`[WorldDataSeeder] Synced ${locationsData.length} locations to database.`);

  // 3. Seed NPCs
  for (const npc of npcsData) {
    await NPC.upsert(npc);
  }
  console.log(`[WorldDataSeeder] Synced ${npcsData.length} NPCs to database.`);

  // 4. Seed Quests & Objectives
  for (const q of questsData) {
    const { objectives, ...questFields } = q;
    await Quest.upsert(questFields);
    if (Array.isArray(objectives)) {
      for (const obj of objectives) {
        await QuestObjective.upsert({ ...obj, questId: q.id });
      }
    }
  }
  console.log(`[WorldDataSeeder] Synced ${questsData.length} master quests and objectives to database.`);
}

module.exports = {
  seedWorldData,
  itemsData,
  npcsData,
  locationsData,
  questsData
};
