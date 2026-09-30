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
  // Modern Tech & Devices (excluding bare 'hp' and 'pc' which conflict with RPG Health Points / Player Character)
  /\b(smartphone|handphone|ponsel|iphone|android|laptop|komputer|gadget|tablet|ipad)\b/i,
  /\b(senter\s+hp|layar\s+hp|buka\s+hp|main\s+hp|cas\s+hp|charger\s+hp|notif\s+hp|pesan\s+hp|kamera\s+hp|telepon\s+hp)\b/i,
  /\bhp\s+(android|iphone|rusak|mati\s+total|lowbat|baterai)\b/i,
  /\b(personal\s+computer|rakit\s+pc|pc\s+gaming)\b/i,
  /\b(internet|wifi|bluetooth|hotspot|charger|baterai|kamera\s+digital)\b/i,
  // Modern Firearms & Explosives (using rpg-7 / senjata rpg to avoid conflict with RPG acronym)
  /\b(senjata\s+api|pistol|revolver|shotgun|senapan|ak-?47|m16|bazooka|granat|bom\s+atom|nuklir|misil|roket|rpg-?7|senjata\s+rpg)\b/i,
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

  return `Niat tindakan "${actionText}" terpancar nyata dari kehendak ${charName} sang ${charClass}. Alih-alih mandek, energi Aether di sekitarmu merespons secara tak terduga—memicu getaran arkana yang mengejutkan ${speaker}! Tindakan berani ini langsung memicu reaksi di lingkungan sekitarmu dan menyingkap dinamika baru yang menuntut langkah taktis berikutnya untuk menuntaskan misi.`;
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
