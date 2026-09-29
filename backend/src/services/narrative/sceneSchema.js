const { z } = require('zod');
const itemMaster = require('../../engine/itemMaster');

// Helper to sanitize em dashes and invalid typographical dashes
function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/—/g, ', ').replace(/–/g, '-').trim();
}

/**
 * Resolves item definition strictly through single source of truth (itemMaster).
 */
function resolveItemById(itemId) {
  if (!itemId || typeof itemId !== 'string') return null;
  const def = itemMaster.getItem(itemId);
  if (!def) return null;
  return {
    id: def.id,
    name: def.name,
    category: def.category || 'Pusaka',
    effect: typeof def.effect === 'object' ? (def.effect.description || def.description || '') : (def.effect || def.description || ''),
    icon: def.icon || 'item_04_silver_dagger'
  };
}

// 1. Strict Item Schema
const itemSchema = z.object({
  id: z.string().min(1, 'Item ID cannot be empty'),
  name: z.string().min(1, 'Item name cannot be empty'),
  category: z.string().default('Pusaka'),
  effect: z.string().default(''),
  icon: z.string().default('item_04_silver_dagger')
});

// 2. Strict Combat Encounter Schema
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
  tone: z.preprocess((val) => {
    if (typeof val === 'string') {
      const lower = val.toLowerCase().trim();
      const valid = ['cautious', 'aggressive', 'diplomatic', 'inquisitive', 'bold', 'curious', 'shrewd', 'kreatif'];
      if (valid.includes(lower)) return lower;
    }
    return 'cautious';
  }, z.enum([
    'cautious',
    'aggressive',
    'diplomatic',
    'inquisitive',
    'bold',
    'curious',
    'shrewd',
    'kreatif'
  ])).default('cautious'),
  actionType: z.preprocess((val) => {
    if (typeof val === 'string') {
      const upper = val.toUpperCase().trim();
      const valid = ['INVESTIGATE', 'ATTACK', 'TALK', 'MOVE', 'USE_ITEM', 'MAGIC', 'STEALTH', 'INTERACT', 'OBSERVE', 'UNKNOWN'];
      if (valid.includes(upper)) return upper;
      if (upper.includes('ATTACK') || upper.includes('FIGHT') || upper.includes('COMBAT')) return 'ATTACK';
      if (upper.includes('TALK') || upper.includes('SPEAK') || upper.includes('NEGOTIATE')) return 'TALK';
      if (upper.includes('MOVE') || upper.includes('RUN') || upper.includes('FLEE') || upper.includes('ESCAPE')) return 'MOVE';
      if (upper.includes('MAGIC') || upper.includes('SPELL') || upper.includes('CAST')) return 'MAGIC';
      if (upper.includes('ITEM') || upper.includes('POTION')) return 'USE_ITEM';
      if (upper.includes('STEALTH') || upper.includes('SNEAK') || upper.includes('HIDE')) return 'STEALTH';
      if (upper.includes('LOOK') || upper.includes('OBSERVE') || upper.includes('WATCH')) return 'OBSERVE';
      return 'INVESTIGATE';
    }
    return 'INVESTIGATE';
  }, z.enum([
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
  ])).default('INVESTIGATE'),
  requiredItem: z.string().nullable().optional()
});

// 4. Canonical State Updates Schema
const stateUpdatesSchema = z.object({
  hpChange: z.number().int().default(0),
  manaChange: z.number().int().default(0),
  goldChange: z.number().int().default(0),
  receivedItemId: z.string().nullable().optional(),
  consumedItemId: z.string().nullable().optional(),
  receivedItem: itemSchema.nullable().optional(),
  consumedItem: z.union([z.string(), itemSchema]).nullable().optional(),
  reputationChange: z.record(z.string(), z.number()).default({}),
  factDiscovered: z.string().nullable().optional()
}).default({});

// 5. Strict Mission Log Schema
const missionLogSchema = z.object({
  title: z.string().min(1).default('Jurnal Misi Petualang'),
  prologue: z.string().default(''),
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

/**
 * Normalization function to align backward-compatible and canonical schema fields
 */
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

  const hpChange = typeof rawSu.hpChange === 'number' ? rawSu.hpChange : (Number(rawSu.hpChange) || 0);
  const manaChange = typeof rawSu.manaChange === 'number' ? rawSu.manaChange : (Number(rawSu.manaChange) || 0);
  const goldChange = typeof rawSu.goldChange === 'number' ? rawSu.goldChange : (Number(rawSu.goldChange) || 0);

  let candidateItemId = rawSu.receivedItemId || (rawSu.receivedItem && typeof rawSu.receivedItem === 'object' ? rawSu.receivedItem.id : (typeof rawSu.receivedItem === 'string' ? rawSu.receivedItem : null));
  let receivedItem = null;
  let receivedItemId = null;
  if (candidateItemId) {
    const resolved = resolveItemById(candidateItemId);
    if (resolved) {
      receivedItem = resolved;
      receivedItemId = resolved.id;
    }
  }

  let consumedCandidate = rawSu.consumedItemId || (typeof rawSu.consumedItem === 'string' ? rawSu.consumedItem : (rawSu.consumedItem?.id || null));
  let consumedItemId = null;
  let consumedItem = null;
  if (consumedCandidate) {
    const resolvedConsumed = resolveItemById(consumedCandidate);
    if (resolvedConsumed) {
      consumedItemId = resolvedConsumed.id;
      consumedItem = resolvedConsumed.id;
    }
  }

  const factDiscovered = rawSu.factDiscovered || null;
  const rep = (rawSu.reputationChange && typeof rawSu.reputationChange === 'object') ? rawSu.reputationChange : {};

  normalized.stateUpdates = {
    hpChange,
    manaChange,
    goldChange,
    receivedItemId,
    consumedItemId,
    receivedItem,
    consumedItem,
    reputationChange: rep,
    factDiscovered: factDiscovered ? cleanText(factDiscovered) : null
  };

  // Normalize missionLog
  if (normalized.missionLog && typeof normalized.missionLog === 'object') {
    const ml = normalized.missionLog;
    const title = cleanText(ml.title || 'Jurnal Misi Petualang');
    const prologue = cleanText(ml.prologue || '');
    const objective = cleanText(ml.objective || 'Tuntaskan penyelidikan dan atasi krisis utama.');
    const status = ['active', 'completed', 'failed'].includes(ml.status) ? ml.status : 'active';

    normalized.missionLog = {
      title,
      prologue,
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

  let sanitized = rawText.trim();
  if (sanitized.startsWith('```')) {
    sanitized = sanitized.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  const firstBrace = sanitized.indexOf('{');
  const lastBrace = sanitized.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    sanitized = sanitized.substring(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(sanitized);
  } catch (err) {
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

function validateScene(raw) {
  const normalized = normalizeSceneData(raw);
  return sceneSchema.parse(normalized);
}

module.exports = {
  cleanText,
  KNOWN_ITEMS: itemMaster.ITEM_CATALOG,
  ITEM_ALIASES: itemMaster.ITEM_ALIASES,
  resolveItemById,
  itemSchema,
  combatEncounterSchema,
  choiceSchema,
  stateUpdatesSchema,
  missionLogSchema,
  sceneSchema,
  normalizeSceneData,
  parseSceneJson,
  validateScene
};
