const { z } = require('zod');

// Helper to sanitize em dashes and invalid typographical dashes
function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/—/g, ', ').replace(/–/g, '-').trim();
}

// Master item registry for consistency across the narrative engine
const KNOWN_ITEMS = {
  item_01_potion_heal: {
    id: 'item_01_potion_heal',
    name: 'Ramuan Penyembuh Darah',
    category: 'Obat',
    effect: 'Memulihkan 25 Hit Points seketika',
    icon: 'item_01_potion_heal'
  },
  item_02_potion_mana: {
    id: 'item_02_potion_mana',
    name: 'Ramuan Pemuas Mana',
    category: 'Obat',
    effect: 'Memulihkan 20 Mana seketika',
    icon: 'item_02_potion_mana'
  },
  item_03_grimoire: {
    id: 'item_03_grimoire',
    name: 'Grimoire Mantra Kuno',
    category: 'Pusaka',
    effect: 'Meningkatkan intuisi arkana dan mantra magis',
    icon: 'item_03_grimoire'
  },
  item_04_silver_dagger: {
    id: 'item_04_silver_dagger',
    name: 'Belati Perak Berukir',
    category: 'Senjata',
    effect: 'Meningkatkan serangan fisik dan mengatasi makhluk bayangan',
    icon: 'item_04_silver_dagger'
  },
  item_05_cursed_amulet: {
    id: 'item_05_cursed_amulet',
    name: 'Amulet Terkutuk',
    category: 'Pusaka',
    effect: 'Memancarkan aura kegelapan misterius',
    icon: 'item_05_cursed_amulet'
  },
  item_06_skeleton_key: {
    id: 'item_06_skeleton_key',
    name: 'Kunci Tengkorak Kuno',
    category: 'Kunci',
    effect: 'Dapat membuka gembok makam bawah tanah',
    icon: 'item_06_skeleton_key'
  },
  item_07_golden_compass: {
    id: 'item_07_golden_compass',
    name: 'Kompas Emas Pengelana',
    category: 'Alat',
    effect: 'Menunjukkan arah ruangan tersembunyi',
    icon: 'item_07_golden_compass'
  },
  item_08_dragon_shield: {
    id: 'item_08_dragon_shield',
    name: 'Perisai Sisik Naga',
    category: 'Perisai',
    effect: 'Menahan serangan api dan guncangan fisik',
    icon: 'item_08_dragon_shield'
  },
  item_09_gold_pouch: {
    id: 'item_09_gold_pouch',
    name: 'Kantung Koin Emas',
    category: 'Harta',
    effect: 'Menambah cadangan kas pemain',
    icon: 'item_09_gold_pouch'
  },
  item_10_elixir_vitality: {
    id: 'item_10_elixir_vitality',
    name: 'Eliksir Vitalitas Abadi',
    category: 'Obat',
    effect: 'Memulihkan 50 HP seketika',
    icon: 'item_10_elixir_vitality'
  },
  item_15_lockpick_set: {
    id: 'item_15_lockpick_set',
    name: 'Set Pencongkel Kunci',
    category: 'Alat',
    effect: 'Membuka peti atau pintu tanpa kunci',
    icon: 'item_15_lockpick_set'
  },
  item_trophy_aether: {
    id: 'item_trophy_aether',
    name: 'Medali Legenda Aether',
    category: 'Pusaka',
    effect: 'Tanda kehormatan tertinggi atas penaklukan petualangan',
    icon: 'item_04_silver_dagger'
  }
};

// Aliases mapping (e.g. historical name inconsistencies)
const ITEM_ALIASES = {
  item_01_health_potion: 'item_01_potion_heal',
  potion_heal: 'item_01_potion_heal',
  health_potion: 'item_01_potion_heal',
  skeleton_key: 'item_06_skeleton_key',
  silver_dagger: 'item_04_silver_dagger'
};

function resolveItemById(itemId) {
  if (!itemId || typeof itemId !== 'string') return null;
  const normalizedId = ITEM_ALIASES[itemId.trim()] || itemId.trim();
  if (KNOWN_ITEMS[normalizedId]) {
    return { ...KNOWN_ITEMS[normalizedId] };
  }
  return {
    id: normalizedId,
    name: normalizedId.replace(/^item_\d+_?/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Benda Misterius',
    category: 'Pusaka',
    effect: 'Benda berharga dari penjelajahan',
    icon: KNOWN_ITEMS[normalizedId]?.icon || 'item_04_silver_dagger'
  };
}

// 1. Strict Item Schema (No z.any())
const itemSchema = z.object({
  id: z.string().min(1, 'Item ID cannot be empty'),
  name: z.string().min(1, 'Item name cannot be empty'),
  category: z.string().default('Pusaka'),
  effect: z.string().default(''),
  icon: z.string().default('item_04_silver_dagger')
});

// 2. Strict Combat Encounter Schema (No z.any())
const combatEncounterSchema = z.object({
  encounterId: z.string().min(1, 'Encounter ID cannot be empty'),
  enemyId: z.string().min(1, 'Enemy ID cannot be empty'),
  enemyName: z.string().min(1, 'Enemy name cannot be empty'),
  enemyHp: z.number().int().positive('Enemy HP must be positive'),
  enemyMaxHp: z.number().int().positive('Enemy Max HP must be positive'),
  enemyAttack: z.number().int().nonnegative('Enemy Attack must be non-negative'),
  enemyDefense: z.number().int().nonnegative('Enemy Defense must be non-negative')
}).nullable().optional();

// 3. Strict Choice Schema
const choiceSchema = z.object({
  id: z.string().min(1, 'Choice ID cannot be empty'),
  text: z.string().min(1, 'Choice text cannot be empty'),
  tone: z.enum([
    'cautious',
    'aggressive',
    'diplomatic',
    'inquisitive',
    'bold',
    'curious',
    'shrewd',
    'kreatif'
  ]).default('cautious'),
  actionType: z.enum([
    'INVESTIGATE',
    'ATTACK',
    'TALK',
    'MOVE',
    'USE_ITEM',
    'MAGIC',
    'STEALTH',
    'INTERACT',
    'OBSERVE',
    'UNKNOWN'
  ]).default('INVESTIGATE'),
  requiredItem: z.string().nullable().optional()
});

// 4. Strict State Updates Schema
const stateUpdatesSchema = z.object({
  proposedHpChange: z.number().int().default(0),
  proposedManaChange: z.number().int().default(0),
  proposedGoldChange: z.number().int().default(0),
  hpChange: z.number().int().default(0),
  manaChange: z.number().int().default(0),
  goldChange: z.number().int().default(0),
  receivedItemId: z.string().nullable().optional(),
  consumedItemId: z.string().nullable().optional(),
  receivedItem: itemSchema.nullable().optional(),
  consumedItem: z.union([z.string(), itemSchema]).nullable().optional(),
  reputationChange: z.record(z.string(), z.number()).default({}),
  reputation: z.record(z.string(), z.number()).default({}),
  factDiscovered: z.string().nullable().optional(),
  addLedgerFact: z.string().nullable().optional()
}).default({});

// 5. Strict Mission Log Schema
const missionLogSchema = z.object({
  title: z.string().min(1).default('Jurnal Misi Petualang'),
  prologue: z.string().default(''),
  targetGoal: z.string().default('Tuntaskan penyelidikan dan atasi krisis utama.'),
  objective: z.string().default('Tuntaskan penyelidikan dan atasi krisis utama.'),
  status: z.enum(['active', 'completed', 'failed']).default('active')
}).nullable().optional();

// 6. Strict Scene Schema
const sceneSchema = z.object({
  chapterTitle: z.string().min(1, 'chapterTitle cannot be empty').default('Babak Petualangan'),
  location: z.string().min(1, 'location cannot be empty').default('Kedai Whispering Tavern'),
  backgroundId: z.string().min(1).default('bg_01_tavern'),
  speaker: z.string().min(1, 'speaker cannot be empty').default('Narator'),
  characterId: z.string().min(1).default('char_npc_01_barkeep'),
  mood: z.enum([
    'neutral',
    'tense',
    'heroic',
    'mysterious',
    'danger',
    'victory',
    'triumphant',
    'ominous',
    'peaceful'
  ]).default('mysterious'),
  dialogue: z.string().min(1, 'dialogue cannot be empty'),
  consequenceNote: z.string().nullable().optional(),
  stateUpdates: stateUpdatesSchema,
  choices: z.array(choiceSchema).min(1, 'Scene must provide at least one choice').default([]),
  combatEncounter: combatEncounterSchema.default(null),
  missionLog: missionLogSchema.default(null)
});

// Normalization function to align backward-compatible and new schema fields
function normalizeSceneData(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Scene data must be an object');
  }

  const normalized = { ...raw };

  // Sanitize texts from em-dashes
  if (normalized.dialogue) normalized.dialogue = cleanText(normalized.dialogue);
  if (normalized.consequenceNote) normalized.consequenceNote = cleanText(normalized.consequenceNote);
  if (normalized.chapterTitle) normalized.chapterTitle = cleanText(normalized.chapterTitle);
  if (normalized.location) normalized.location = cleanText(normalized.location);
  if (normalized.speaker) normalized.speaker = cleanText(normalized.speaker);

  // Normalize stateUpdates
  const rawSu = normalized.stateUpdates && typeof normalized.stateUpdates === 'object'
    ? { ...normalized.stateUpdates }
    : {};

  const hpChange = typeof rawSu.hpChange === 'number' ? rawSu.hpChange : (rawSu.proposedHpChange || 0);
  const proposedHpChange = typeof rawSu.proposedHpChange === 'number' ? rawSu.proposedHpChange : hpChange;

  const manaChange = typeof rawSu.manaChange === 'number' ? rawSu.manaChange : (rawSu.proposedManaChange || 0);
  const proposedManaChange = typeof rawSu.proposedManaChange === 'number' ? rawSu.proposedManaChange : manaChange;

  const goldChange = typeof rawSu.goldChange === 'number' ? rawSu.goldChange : (rawSu.proposedGoldChange || 0);
  const proposedGoldChange = typeof rawSu.proposedGoldChange === 'number' ? rawSu.proposedGoldChange : goldChange;

  let receivedItemId = rawSu.receivedItemId || (rawSu.receivedItem && typeof rawSu.receivedItem === 'object' ? rawSu.receivedItem.id : null);
  if (typeof rawSu.receivedItem === 'string') {
    receivedItemId = rawSu.receivedItem;
  }
  let receivedItem = null;
  if (rawSu.receivedItem && typeof rawSu.receivedItem === 'object' && rawSu.receivedItem.id && rawSu.receivedItem.name) {
    receivedItem = {
      id: rawSu.receivedItem.id,
      name: cleanText(rawSu.receivedItem.name),
      category: rawSu.receivedItem.category || 'Pusaka',
      effect: cleanText(rawSu.receivedItem.effect || ''),
      icon: rawSu.receivedItem.icon || 'item_04_silver_dagger'
    };
  } else if (receivedItemId) {
    receivedItem = resolveItemById(receivedItemId);
  }

  let consumedItemId = rawSu.consumedItemId || (typeof rawSu.consumedItem === 'string' ? rawSu.consumedItem : (rawSu.consumedItem?.id || null));
  let consumedItem = consumedItemId;

  const factDiscovered = rawSu.factDiscovered || rawSu.addLedgerFact || null;
  const addLedgerFact = rawSu.addLedgerFact || factDiscovered;

  const rep = rawSu.reputationChange || rawSu.reputation || {};

  normalized.stateUpdates = {
    proposedHpChange,
    proposedManaChange,
    proposedGoldChange,
    hpChange,
    manaChange,
    goldChange,
    receivedItemId,
    consumedItemId,
    receivedItem,
    consumedItem,
    reputationChange: rep,
    reputation: rep,
    factDiscovered: factDiscovered ? cleanText(factDiscovered) : null,
    addLedgerFact: addLedgerFact ? cleanText(addLedgerFact) : null
  };

  // Normalize missionLog
  if (normalized.missionLog && typeof normalized.missionLog === 'object') {
    const ml = normalized.missionLog;
    const title = cleanText(ml.title || 'Jurnal Misi Petualang');
    const prologue = cleanText(ml.prologue || '');
    const targetGoal = cleanText(ml.targetGoal || ml.objective || 'Tuntaskan penyelidikan dan atasi krisis utama.');
    const objective = cleanText(ml.objective || targetGoal);
    const status = ['active', 'completed', 'failed'].includes(ml.status) ? ml.status : 'active';

    normalized.missionLog = {
      title,
      prologue,
      targetGoal,
      objective,
      status
    };
  }

  // Normalize choices
  if (Array.isArray(normalized.choices)) {
    normalized.choices = normalized.choices.map((c, idx) => {
      if (!c || typeof c !== 'object') {
        return {
          id: `c_${idx + 1}`,
          text: 'Melangkah maju dengan waspada',
          tone: 'cautious',
          actionType: 'INVESTIGATE',
          requiredItem: null
        };
      }
      return {
        id: c.id ? String(c.id) : `c_${idx + 1}`,
        text: cleanText(c.text || 'Melangkah maju dengan waspada'),
        tone: c.tone || 'cautious',
        actionType: c.actionType || 'INVESTIGATE',
        requiredItem: c.requiredItem ? String(c.requiredItem) : null
      };
    });
  } else {
    normalized.choices = [
      {
        id: 'c1',
        text: 'Amati situasi sekitar dengan waspada',
        tone: 'cautious',
        actionType: 'INVESTIGATE',
        requiredItem: null
      }
    ];
  }

  return normalized;
}

function parseSceneJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('rawText must be a non-empty string');
  }

  // Strip markdown code fences if present
  let sanitized = rawText.trim();
  if (sanitized.startsWith('```')) {
    sanitized = sanitized.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  // Find bounding braces if any additional text precedes or follows
  const firstBrace = sanitized.indexOf('{');
  const lastBrace = sanitized.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    sanitized = sanitized.substring(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(sanitized);
  } catch (err) {
    // Attempt basic JSON repair: remove trailing commas before } or ]
    try {
      const repaired = sanitized
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      parsed = JSON.parse(repaired);
    } catch (secondErr) {
      throw new Error(`JSON parse failed: ${err.message}`);
    }
  }

  const normalized = normalizeSceneData(parsed);
  return sceneSchema.parse(normalized);
}

module.exports = {
  cleanText,
  KNOWN_ITEMS,
  ITEM_ALIASES,
  resolveItemById,
  itemSchema,
  combatEncounterSchema,
  choiceSchema,
  stateUpdatesSchema,
  missionLogSchema,
  sceneSchema,
  normalizeSceneData,
  parseSceneJson
};
