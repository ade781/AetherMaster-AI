const INTENT_TYPES = [
  'TALK',
  'INVESTIGATE',
  'MOVE',
  'ATTACK',
  'MAGIC',
  'STEALTH',
  'USE_ITEM',
  'OBSERVE',
  'INTERACT',
  'UNKNOWN'
];

// Patterns representing non-diegetic, modern, or anachronistic concepts
const ANACHRONISTIC_PATTERNS = [
  // Modern Tech & Devices
  /\b(smartphone|handphone|hp|ponsel|iphone|android|laptop|komputer|pc|gadget|tablet|ipad)\b/i,
  /\b(internet|wifi|bluetooth|hotspot|charger|baterai|kamera\s+digital)\b/i,
  // Modern Firearms & Explosives
  /\b(senjata\s+api|pistol|revolver|shotgun|senapan|ak-?47|m16|bazooka|granat|bom\s+atom|nuklir|misil|roket|rpg)\b/i,
  // Modern Vehicles & Infrastructure
  /\b(mobil|motor|sepeda\s+motor|truk|bus|pesawat|helikopter|kereta\s+listrik|kapal\s+selam\s+modern)\b/i,
  /\b(kantor\s+polisi|gedung\s+dpr|presiden|menteri|polisi|satpam)\b/i,
  // Modern Software, Slang & Out of World Concepts
  /\b(chatgpt|openai|ai\s+bot|coding|programmer|developer|hacker|login|password|website|server|database)\b/i,
  /\b(youtube|tiktok|instagram|twitter|medsos|zoom\s+meeting|google)\b/i,
  // Gibberish and non-words
  /^(asdf+|qwerty+|test+|testing+|12345+|halo\s+test)$/i
];

// Contextual intent keywords
const INTENT_KEYWORDS = {
  TALK: [
    'bicara', 'bincang', 'tanya', 'bertanya', 'interogasi', 'intrograsi', 'sapa', 'menyapa',
    'bujuk', 'rayu', 'gertak', 'ancam', 'dialog', 'diskusi', 'negosiasi', 'katakan', 'tanyakan',
    'berucap', 'berbisik', 'meminta penjelasan', 'klarifikasi'
  ],
  INVESTIGATE: [
    'periksa', 'selidiki', 'investigasi', 'geledah', 'cari', 'mencari', 'telaah', 'inspeksi',
    'baca', 'manuskrip', 'kitab', 'analisis', 'rekam jejak', 'simbol', 'relief', 'pecahan',
    'jejak', 'peti', 'celah'
  ],
  MOVE: [
    'jalan', 'melangkah', 'lari', 'pergi', 'menuju', 'masuki', 'masuk', 'dekati', 'mendekat',
    'susuri', 'kabur', 'mundur', 'menjauh', 'lewati', 'panjat', 'melompat', 'terobos'
  ],
  ATTACK: [
    'serang', 'tebas', 'menyerang', 'menebas', 'pukul', 'menghantam', 'hantam', 'tusuk',
    'tikam', 'hancurkan', 'dobrak', 'ayunkan pedang', 'tembak panah', 'tendang'
  ],
  MAGIC: [
    'sihir', 'mantra', 'jampi', 'arkana', 'rapalkan', 'merapalkan', 'salurkan mana',
    'teleport', 'bola api', 'petir', 'semburan es', 'pelindung gaib', 'pesona gaib'
  ],
  STEALTH: [
    'menyelinap', 'sembunyi', 'bersembunyi', 'senyap', 'mengendap', 'merayap', 'mengintai',
    'intai', 'intai musuh', 'dalam bayang', 'bayang-bayang', 'samarkan diri'
  ],
  USE_ITEM: [
    'gunakan', 'memakai', 'pakai', 'minum', 'teguk', 'konsumsi', 'telan', 'ramuan',
    'kunci', 'buka gembok', 'jimat', 'amulet', 'obor', 'sulut', 'perban'
  ],
  OBSERVE: [
    'amati', 'mengamati', 'pantau', 'memantau', 'waspada', 'lihat sekeliling', 'awasi',
    'intip', 'dengarkan', 'perhatikan', 'siaga'
  ],
  INTERACT: [
    'dorong', 'tarik', 'putar', 'tekan', 'sentuh', 'buka tuas', 'katup', 'mekanisme',
    'ambil', 'raih', 'jabat tangan', 'aktifkan'
  ]
};

function isAnachronisticAction(actionText) {
  if (!actionText || typeof actionText !== 'string') return false;
  const clean = actionText.trim().toLowerCase();
  return ANACHRONISTIC_PATTERNS.some(regex => regex.test(clean));
}

function generateDiegeticFeedback(actionText, context = {}) {
  const speaker = context.speaker || context.previousNode?.speaker || 'Sosok di hadapanmu';
  const charName = context.character?.name || 'Petualang';
  const charClass = context.character?.characterClass || 'Pengelana';

  return `Kata-kata atau tindakan "${actionText}" terdengar sangat asing di dunia benua Aether. ${speaker} menatap ${charName} sang ${charClass} dengan kening berkerut heran, mengira kamu sedang menggumamkan igauan dari demam tinggi atau bisikan aneh dari alam mimpi. Tidak ada perangkat atau sihir semacam itu di sini, dan situasi nyata di hadapanmu menuntut kewaspadaan penuh!`;
}

function resolvePlayerIntent(actionText, context = {}) {
  if (!actionText || typeof actionText !== 'string' || !actionText.trim()) {
    return {
      intent: 'UNKNOWN',
      actionType: 'UNKNOWN',
      isAnachronistic: false,
      isImpossible: false,
      diegeticFeedback: null,
      confidence: 0,
      tags: []
    };
  }

  const text = actionText.trim();
  const lower = text.toLowerCase();

  // 1. Check for non-diegetic / anachronistic actions
  if (isAnachronisticAction(lower)) {
    return {
      intent: 'UNKNOWN',
      actionType: 'UNKNOWN',
      isAnachronistic: true,
      isImpossible: true,
      diegeticFeedback: generateDiegeticFeedback(text, context),
      confidence: 0.95,
      tags: ['anachronistic', 'out_of_world']
    };
  }

  // 2. Score intents based on keyword matches
  const scores = {};
  for (const [intentKey, keywords] of Object.entries(INTENT_KEYWORDS)) {
    scores[intentKey] = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[intentKey] += kw.length > 5 ? 2 : 1;
      }
    }
  }

  // Check inventory context if action mentions using items
  if (context.character?.inventory && Array.isArray(context.character.inventory)) {
    for (const item of context.character.inventory) {
      if (item && item.name && lower.includes(item.name.toLowerCase())) {
        scores.USE_ITEM = (scores.USE_ITEM || 0) + 3;
      }
    }
  }

  // Determine top scored intent
  let highestIntent = 'UNKNOWN';
  let highestScore = 0;
  for (const [intent, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      highestIntent = intent;
    }
  }

  // Default to INVESTIGATE or OBSERVE if ambiguous but descriptive
  if (highestScore === 0) {
    if (lower.length > 25) {
      highestIntent = 'INVESTIGATE';
      highestScore = 1;
    } else {
      highestIntent = 'UNKNOWN';
    }
  }

  const confidence = highestScore >= 3 ? 0.9 : highestScore >= 1 ? 0.7 : 0.4;

  return {
    intent: highestIntent,
    actionType: highestIntent,
    isAnachronistic: false,
    isImpossible: false,
    diegeticFeedback: null,
    confidence,
    tags: [highestIntent.toLowerCase()]
  };
}

module.exports = {
  INTENT_TYPES,
  isAnachronisticAction,
  generateDiegeticFeedback,
  resolvePlayerIntent
};
