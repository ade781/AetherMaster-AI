/**
 * AetherMaster Dynamic Campaign Mock API Adapter
 * Independent procedural campaign generator and mock service.
 * Guarantees Zero Collision with backend during development and enables full offline functionality.
 */

export const PRESET_THEMES = [
  {
    id: 'gothic-dungeon',
    name: 'Gothic Dungeon',
    tagline: 'Kastil Terkutuk & Ruang Bawah Tanah Berkabut',
    icon: 'Castle',
    accentColor: 'rose',
    ambientSound: 'dungeon',
    bgId: 'bg_04_crimson_crypt',
    description: 'Koridor dingin berlapis batu hitam, obor berkelap-kelip, dan jeritan dari kedalaman jurang jiwa.',
    suggestedEnemies: ['Vampire Thrall', 'Barrow Wight', 'Lord of Shadows']
  },
  {
    id: 'sunken-citadel',
    name: 'Sunken Citadel',
    tagline: 'Kuil Samudra Kuno & Reruntuhan Tenggelam',
    icon: 'Waves',
    accentColor: 'cyan',
    ambientSound: 'citadel',
    bgId: 'bg_03_ruins',
    description: 'Arsitektur megalitikum yang terendam air pasang berlumut, rumah bagi kultus dewa air purba.',
    suggestedEnemies: ['Drowned Cultist', 'Deepwater Siren', 'Abyssal Guardian']
  },
  {
    id: 'eldritch-forest',
    name: 'Eldritch Forest',
    tagline: 'Hutan Kabut Mistis & Ilusi Fae Liar',
    icon: 'Trees',
    accentColor: 'emerald',
    ambientSound: 'mystic',
    bgId: 'bg_02_forest',
    description: 'Pohon-pohon raksasa berakar ungu di mana waktu terpelintir dan suara bisikan menuntun ke jurang ilusi.',
    suggestedEnemies: ['Fae Stalker', 'Blight Treant', 'Night Hag']
  },
  {
    id: 'arcane-laboratory',
    name: 'Arcane Laboratory',
    tagline: 'Menara Alkimia Terlarang & Retakan Mana',
    icon: 'FlaskConical',
    accentColor: 'purple',
    ambientSound: 'arcane',
    bgId: 'bg_01_tavern',
    description: 'Aparatus tembaga bergetar dengan kilatan petir aether, tempat eksperimen terlarang melampaui batas mortalitas.',
    suggestedEnemies: ['Mana Homunculus', 'Rogue Alchemist', 'Aether Golem']
  },
  {
    id: 'desert-of-bones',
    name: 'Desert of Bones',
    tagline: 'Gurun Pasir Terik & Makam Firaun Kuno',
    icon: 'Flame',
    accentColor: 'amber',
    ambientSound: 'combat',
    bgId: 'bg_04_crimson_crypt',
    description: 'Lautan pasir putih berhias kerangka monster purba, badai pasir magis yang menyembunyikan makam terlarang.',
    suggestedEnemies: ['Scorpion Rider', 'Mummy Sovereign', 'Sand Wraith']
  }
];

export const DIFFICULTY_PRESETS = [
  {
    id: 'easy',
    name: 'Casual Adventurer',
    label: 'Mudah',
    crModifier: -1,
    badgeVariant: 'emerald',
    description: 'Fokus pada narasi dan eksplorasi santai. Serangan musuh lebih mudah diantisipasi.',
    enemyHpMultiplier: 0.85
  },
  {
    id: 'balanced',
    name: 'D&D 5E Standard',
    label: 'Seimbang',
    crModifier: 0,
    badgeVariant: 'gold',
    description: 'Tantangan taktis D&D 5E resmi dengan kalkulasi AC dan DC yang proporsional.',
    enemyHpMultiplier: 1.0
  },
  {
    id: 'hardcore',
    name: 'Veteran Tactician',
    label: 'Hardcore',
    crModifier: 2,
    badgeVariant: 'purple',
    description: 'Pertarungan sengit dengan ancaman status effect ganda dan monster dengan AI agresif.',
    enemyHpMultiplier: 1.3
  },
  {
    id: 'deadly',
    name: 'Permadeath Crucible',
    label: 'Mematikan',
    crModifier: 4,
    badgeVariant: 'rose',
    description: 'Kesalahan taktis berujung fatal. Musuh memiliki serangan kritis mematikan dan pertahanan tinggi.',
    enemyHpMultiplier: 1.65
  }
];

export const NPC_ROLE_PRESETS = [
  { role: 'Quest Giver', icon: 'Scroll', color: 'amber' },
  { role: 'Merchant', icon: 'Coins', color: 'emerald' },
  { role: 'Ally', icon: 'Shield', color: 'cyan' },
  { role: 'Rival', icon: 'Swords', color: 'rose' }
];

const NPC_NAME_BANK = {
  Elf: ['Aeloria Silvermoon', 'Theron Vael', 'Sylas Whispershade', 'Lyra Starwhisper'],
  Dwarf: ['Thorin Ironhelm', 'Brakka Stonefist', 'Durnan Deepforge', 'Helga Rubyvein'],
  Human: ['Valerius Vance', 'Rowena Cross', 'Gideon Blackwood', 'Eleanor Bright'],
  Tiefling: ['Malakor Hellfire', 'Azira Netherbrand', 'Dante Voidstep', 'Kallista Ash'],
  Dragonborn: ['Balerion Flamecaller', 'Karkesh Scaleguard', 'Vorath Drakeblood', 'Nidra Emberwing']
};

const NPC_QUOTES = {
  'Quest Giver': [
    'Malam semakin pekat di Aetheria... Aku butuh seseorang yang tidak gentar menghadapi maut.',
    'Gulungan takdir ini hanya bisa dipecahkan oleh penjelajah yang berani melangkah ke reruntuhan.',
    'Krisis bayangan kian mendekat. Maukah engkau mengambil pedang demi keselamatan kita?'
  ],
  'Merchant': [
    'Baja terbaik dari pandai besi gunung dan ramuan terlangka. Koin emasmu bernilai keselamatanmu di sini!',
    'Barang langka, harga bersahabat. Periksa ramuan ini sebelum engkau melangkah ke sarang iblis.',
    'Hanya yang bersiap terbaik yang bertahan hidup. Apa yang engkau cari hari ini?'
  ],
  'Ally': [
    'Tongkat sihirku bersamamu. Kita hadapi kengerian ini bahu-membahu!',
    'Aku pernah melihat kegelapan itu sebelumnya. Bersama, kita tak akan tumbang.',
    'Tetap waspada pada punggungmu, kawan. Serahkan mantra pelindung kepadaku.'
  ],
  'Rival': [
    'Artefak itu milikku, pemula! Jangan menghalangi jalanku jika engkau masih menghargai nyawamu.',
    'Kau kira kau satu-satunya yang memburu kehormatan di tanah terkutuk ini?',
    'Langkahmu lamban. Aku akan tiba di ruang tahta lebih dulu daripada dirimu.'
  ]
};

/**
 * Generate a procedural dynamic NPC
 */
export function mockGenerateDynamicNpc(criteria = {}) {
  const races = ['Elf', 'Dwarf', 'Human', 'Tiefling', 'Dragonborn'];
  const classes = ['Penyihir', 'Prajurit', 'Rogue', 'Klerus', 'Ranger', 'Paladin'];
  const roles = ['Quest Giver', 'Merchant', 'Ally', 'Rival'];

  const race = criteria.race || races[Math.floor(Math.random() * races.length)];
  const characterClass = criteria.characterClass || classes[Math.floor(Math.random() * classes.length)];
  const role = criteria.role || roles[Math.floor(Math.random() * roles.length)];

  const names = NPC_NAME_BANK[race] || NPC_NAME_BANK.Human;
  const name = criteria.name || names[Math.floor(Math.random() * names.length)];

  const quotes = NPC_QUOTES[role] || NPC_QUOTES['Quest Giver'];
  const greetingQuote = criteria.greetingQuote || quotes[Math.floor(Math.random() * quotes.length)];

  // Audio voice profile tailored to race & role
  let pitch = 1.0;
  let rate = 1.0;
  let tone = 'neutral';

  if (race === 'Dwarf') {
    pitch = 0.65;
    rate = 0.88;
    tone = 'deep';
  } else if (race === 'Elf') {
    pitch = 1.25;
    rate = 0.95;
    tone = 'melodic';
  } else if (role === 'Rival') {
    pitch = 0.85;
    rate = 1.05;
    tone = 'gruff';
  } else if (race === 'Dragonborn') {
    pitch = 0.55;
    rate = 0.82;
    tone = 'deep';
  }

  return {
    id: `npc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    race,
    characterClass,
    role,
    avatarUrl: criteria.avatarUrl || `avatar_${Math.floor(Math.random() * 4) + 1}`,
    greetingQuote,
    voiceConfig: {
      pitch,
      rate,
      tone
    },
    stats: {
      level: criteria.level || Math.floor(Math.random() * 3) + 2,
      ac: 13 + Math.floor(Math.random() * 4),
      hp: 20 + Math.floor(Math.random() * 15)
    },
    bio: `${name} adalah seorang ${race} ${characterClass} yang berperan sebagai ${role} di wilayah ini.`
  };
}

/**
 * Generate a full procedural campaign payload
 */
export async function mockGenerateCampaign(payload = {}) {
  // Simulate network latency (250ms)
  await new Promise(res => setTimeout(res, 250));

  const themeId = payload.themeId || 'gothic-dungeon';
  const theme = PRESET_THEMES.find(t => t.id === themeId) || PRESET_THEMES[0];

  const difficultyId = payload.difficultyId || 'balanced';
  const difficulty = DIFFICULTY_PRESETS.find(d => d.id === difficultyId) || DIFFICULTY_PRESETS[1];

  const nodeCount = Number(payload.storyLength) || 7;
  const premise = payload.narrativePrompt?.trim() || `Ekspedisi penjelajahan misteri di ${theme.name}`;

  // Generate dynamic NPC deck (2 to 4 NPCs)
  const npcs = [
    mockGenerateDynamicNpc({ role: 'Quest Giver' }),
    mockGenerateDynamicNpc({ role: 'Merchant' }),
    mockGenerateDynamicNpc({ role: 'Ally' }),
    mockGenerateDynamicNpc({ role: 'Rival' })
  ].slice(0, Math.min(4, Math.max(2, Math.floor(nodeCount / 2))));

  // Procedural Enemies according to theme & difficulty
  const baseHp = Math.round(25 * difficulty.enemyHpMultiplier);
  const enemyList = [
    {
      id: 'enemy_1',
      name: theme.suggestedEnemies[0] || 'Goblin Shadowblade',
      sprite: 'monster_01_skeleton',
      hp: baseHp,
      maxHp: baseHp,
      ac: 12 + Math.max(0, difficulty.crModifier),
      cr: Math.max(1, 1 + difficulty.crModifier),
      abilities: ['Shadow Strike', 'Nimble Escape']
    },
    {
      id: 'enemy_boss',
      name: theme.suggestedEnemies[theme.suggestedEnemies.length - 1] || 'Archon of Chaos',
      sprite: 'monster_01_skeleton',
      hp: Math.round(baseHp * 1.8),
      maxHp: Math.round(baseHp * 1.8),
      ac: 14 + Math.max(0, difficulty.crModifier),
      cr: Math.max(2, 3 + difficulty.crModifier),
      abilities: ['Dark Nova', 'Aether Shield', 'Legendary Resistance']
    }
  ];

  // Procedural story nodes
  const nodes = [];
  for (let i = 1; i <= nodeCount; i++) {
    const isFirst = i === 1;
    const isBoss = i === nodeCount;
    const isCombat = isBoss || i % 3 === 0;

    nodes.push({
      id: `node_camp_${i}`,
      chapterTitle: isFirst
        ? `Babak 1: Titik Awal di ${theme.name}`
        : isBoss
        ? `Babak ${i}: Konfrontasi Puncak`
        : `Babak ${i}: Investigasi di Kedalaman`,
      location: `${theme.name} • Ruang ${i}`,
      speaker: isFirst ? npcs[0]?.name || 'Pemandu Petualangan' : isCombat ? 'Dungeon Master' : npcs[i % npcs.length]?.name || 'Narator',
      mood: isBoss ? 'menegangkan' : isCombat ? 'waspada' : 'misterius',
      dialogueText: isFirst
        ? `${premise}. Langkah pertamamu menginjak tanah berlumut di ${theme.name}. Di hadapanmu terdapat pintu gerbang besi yang terkunci oleh teka-teki kuno.`
        : isBoss
        ? `Kamu tiba di ruang singgasana terlarang. Energi aether berdenyut dahsyat saat ${enemyList[1].name} bangkit dan mengunci pandangan matanya ke jiwamu!`
        : `Langkah demi langkah menembus lorong ${theme.name}. Suara tetesan air dan gaung langkah kaki mengisyaratkan keberadaan bahaya yang mengintai di balik bayang-bayang.`,
      consequenceNote: isFirst
        ? 'Pilihanmu di babak awal ini akan menentukan sekutu dan perlengkapan awalmu.'
        : isCombat
        ? 'Mode Pertempuran Taktis D&D 5E aktif!'
        : null,
      backgroundId: theme.bgId,
      choices: isCombat ? [] : [
        {
          id: `c_${i}_1`,
          text: 'Gunakan kecerdikan arkana untuk menguraikan jebakan dan memindai aura magis.',
          consequence: 'Kamu menemukan celah taktis yang menguntungkan posisi bertarung.',
          tone: 'intelek'
        },
        {
          id: `c_${i}_2`,
          text: 'Hunus senjata dan terjang ke depan dengan kesiapan penuh.',
          consequence: 'Kamu mengintimidasi lawan namun menarik perhatian musuh sekitar.',
          tone: 'heroik'
        }
      ],
      combatEncounter: isCombat ? (isBoss ? enemyList[1] : enemyList[0]) : null
    });
  }

  const campaignData = {
    id: `custom_campaign_${Date.now()}`,
    title: payload.title || `${theme.name}: ${premise.slice(0, 32)}...`,
    description: premise,
    themeId: theme.id,
    themeName: theme.name,
    difficultyId: difficulty.id,
    difficultyName: difficulty.name,
    crModifier: difficulty.crModifier,
    storyLength: nodeCount,
    coverImage: theme.bgId,
    createdAt: new Date().toISOString(),
    isCustomGenerated: true,
    npcs,
    enemies: enemyList,
    initialNode: nodes[0],
    nodes
  };

  return {
    success: true,
    data: campaignData,
    source: 'mock_local'
  };
}

/**
 * Save custom campaign to local storage cache
 */
export async function mockSaveCustomCampaign(campaignData) {
  try {
    const raw = localStorage.getItem('aethermaster_custom_campaigns') || '[]';
    const list = JSON.parse(raw);
    const updated = [campaignData, ...list.filter(c => c.id !== campaignData.id)];
    localStorage.setItem('aethermaster_custom_campaigns', JSON.stringify(updated));
    return { success: true, data: campaignData };
  } catch (err) {
    return { success: true, data: campaignData, cachedOnly: true };
  }
}

/**
 * Get all saved custom campaigns
 */
export async function mockGetCustomCampaigns() {
  try {
    const raw = localStorage.getItem('aethermaster_custom_campaigns') || '[]';
    const list = JSON.parse(raw);
    return { success: true, data: list };
  } catch (err) {
    return { success: true, data: [] };
  }
}
