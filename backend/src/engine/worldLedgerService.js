/**
 * Structured World Ledger Service
 * Single Source of Truth for World State, Facts, Flags, and Faction Reputation.
 */

/**
 * Normalizes legacy or uninitialized worldLedger into structured ledger format.
 * Guarantees facts array, flags object, questFlags mirror, and reputation object.
 *
 * @param {object|string} rawLedger
 * @returns {object} Normalized structured worldLedger
 */
function normalizeLedger(rawLedger) {
  let parsed = rawLedger;
  if (typeof rawLedger === 'string') {
    try {
      parsed = JSON.parse(rawLedger);
    } catch (e) {
      parsed = {};
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    parsed = {};
  }

  const facts = Array.isArray(parsed.facts) ? [...parsed.facts] : [];
  const flags = { ...(parsed.flags || {}) };
  const questFlags = { ...(parsed.questFlags || {}) };
  const reputation = { ...(parsed.reputation || {}) };

  // Bi-directional synchronization between legacy questFlags and new flags
  for (const [key, val] of Object.entries(questFlags)) {
    if (flags[key] === undefined) {
      flags[key] = val;
    }
  }
  for (const [key, val] of Object.entries(flags)) {
    if (questFlags[key] === undefined) {
      questFlags[key] = val;
    }
  }

  // If facts are empty but legacy questFlags had text facts (e.g. turn_1: "met barkeep")
  if (facts.length === 0) {
    for (const [k, v] of Object.entries(questFlags)) {
      if (typeof v === 'string' && v.trim().length > 0) {
        facts.push({
          id: `fact_migrated_${k}`,
          type: 'LEGACY_FACT',
          target: k,
          turn: parseInt(k.replace('turn_', ''), 10) || 1,
          description: v.trim(),
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  return {
    facts,
    flags,
    questFlags,
    reputation
  };
}

/**
 * Generates a stable deterministic or unique ID for a fact.
 */
function generateFactId(type, target, turn) {
  const cleanType = String(type || 'FACT').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const cleanTarget = String(target || 'GENERAL').toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `fact_${cleanType}_${cleanTarget}_t${turn}`;
}

/**
 * Adds a structured fact to the world ledger with de-duplication.
 *
 * @param {object} worldLedger
 * @param {string|object} factInput - e.g. "Ketukan terdengar" or { type, target, data, turn }
 * @param {number} turn - current turn count
 * @returns {object} { updatedLedger, addedFact, isDuplicate }
 */
function addFact(worldLedger, factInput, turn = 1) {
  const ledger = (worldLedger && typeof worldLedger === 'object' && Array.isArray(worldLedger.facts))
    ? worldLedger
    : normalizeLedger(worldLedger);

  if (!factInput) {
    return { updatedLedger: ledger, addedFact: null, isDuplicate: false };
  }

  let newFact;
  if (typeof factInput === 'string') {
    const desc = factInput.trim();
    if (!desc) {
      return { updatedLedger: ledger, addedFact: null, isDuplicate: false };
    }
    newFact = {
      id: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'WORLD_EVENT',
      target: 'environment',
      description: desc,
      turn: Number(turn) || 1,
      timestamp: new Date().toISOString(),
      data: {}
    };
  } else if (typeof factInput === 'object') {
    const type = factInput.type || 'WORLD_EVENT';
    const target = factInput.target || 'general';
    const desc = factInput.description || factInput.text || `${type}: ${target}`;
    const factTurn = Number(factInput.turn || turn) || 1;

    newFact = {
      id: factInput.id || generateFactId(type, target, factTurn),
      type,
      target,
      description: desc,
      turn: factTurn,
      timestamp: factInput.timestamp || new Date().toISOString(),
      data: factInput.data || {}
    };
  }

  // De-duplication check:
  // Match on explicit ID or identical (type + target + description)
  const isDuplicate = ledger.facts.some(f => {
    if (newFact.id && f.id === newFact.id) return true;
    return f.type === newFact.type &&
      f.target === newFact.target &&
      f.description === newFact.description;
  });

  if (isDuplicate) {
    return { updatedLedger: ledger, addedFact: null, isDuplicate: true };
  }

  ledger.facts.push(newFact);

  // If fact indicates flag setting (e.g. { type: 'DOOR_UNLOCKED', target: 'crypt_gate' })
  if (newFact.type && (newFact.type.includes('UNLOCKED') || newFact.type.includes('COMPLETED') || newFact.type.includes('DISCOVERED'))) {
    const flagKey = `${newFact.target}_${newFact.type.toLowerCase()}`;
    if (!ledger.flags) ledger.flags = {};
    if (!ledger.questFlags) ledger.questFlags = {};
    ledger.flags[flagKey] = true;
    ledger.questFlags[flagKey] = true;
  }

  return {
    updatedLedger: ledger,
    addedFact: newFact,
    isDuplicate: false
  };
}

/**
 * Checks if a fact matching criteria exists in the ledger.
 *
 * @param {object} worldLedger
 * @param {object|string} query - { type, target } or description substring
 * @returns {boolean}
 */
function hasFact(worldLedger, query) {
  const ledger = (worldLedger && typeof worldLedger === 'object' && Array.isArray(worldLedger.facts))
    ? worldLedger
    : normalizeLedger(worldLedger);
  if (!query) return false;

  if (typeof query === 'string') {
    const lower = query.toLowerCase();
    return ledger.facts.some(f => (f.description && f.description.toLowerCase().includes(lower)) || f.target === query);
  }

  return ledger.facts.some(f => {
    if (query.id && f.id !== query.id) return false;
    if (query.type && f.type !== query.type) return false;
    if (query.target && f.target !== query.target) return false;
    if (query.turn && f.turn !== query.turn) return false;
    return true;
  });
}

/**
 * Sets a flag in both flags and questFlags for full compatibility.
 *
 * @param {object} worldLedger
 * @param {string} flagName
 * @param {*} value
 * @returns {object}
 */
function setFlag(worldLedger, flagName, value = true) {
  const ledger = (worldLedger && typeof worldLedger === 'object' && worldLedger.flags)
    ? worldLedger
    : normalizeLedger(worldLedger);
  if (!flagName) return ledger;
  if (!ledger.flags) ledger.flags = {};
  if (!ledger.questFlags) ledger.questFlags = {};
  ledger.flags[flagName] = value;
  ledger.questFlags[flagName] = value;
  return ledger;
}

/**
 * Gets a flag value from the ledger.
 *
 * @param {object} worldLedger
 * @param {string} flagName
 * @param {*} defaultValue
 * @returns {*}
 */
function getFlag(worldLedger, flagName, defaultValue = false) {
  const ledger = (worldLedger && typeof worldLedger === 'object' && worldLedger.flags)
    ? worldLedger
    : normalizeLedger(worldLedger);
  if (ledger.flags && ledger.flags[flagName] !== undefined) return ledger.flags[flagName];
  if (ledger.questFlags && ledger.questFlags[flagName] !== undefined) return ledger.questFlags[flagName];
  return defaultValue;
}

/**
 * Modifies faction reputation deterministically.
 *
 * @param {object} worldLedger
 * @param {string} faction
 * @param {number} delta
 * @returns {object}
 */
function updateReputation(worldLedger, faction, delta) {
  const ledger = (worldLedger && typeof worldLedger === 'object' && worldLedger.reputation)
    ? worldLedger
    : normalizeLedger(worldLedger);
  if (!faction) return ledger;
  if (!ledger.reputation) ledger.reputation = {};
  const current = Number(ledger.reputation[faction] || 0);
  const change = Number(delta) || 0;
  ledger.reputation[faction] = current + change;
  return ledger;
}

/**
 * Queries relevant facts for AI context injection without bloated history.
 *
 * @param {object} worldLedger
 * @param {object} options - { limit, currentTurn, target, type }
 * @returns {Array<object>}
 */
function getRelevantFacts(worldLedger, options = {}) {
  const ledger = normalizeLedger(worldLedger);
  const limit = options.limit || 8;
  let filtered = [...ledger.facts];

  if (options.target) {
    filtered = filtered.filter(f => f.target === options.target);
  }
  if (options.type) {
    filtered = filtered.filter(f => f.type === options.type);
  }

  // Sort by turn descending (most recent first)
  filtered.sort((a, b) => (b.turn || 0) - (a.turn || 0));

  return filtered.slice(0, limit);
}

/**
 * Summarizes the ledger into human-readable bullet points for prompt injection.
 *
 * @param {object} worldLedger
 * @param {number} limit
 * @returns {string}
 */
function summarizeForPrompt(worldLedger, limit = 6) {
  const ledger = normalizeLedger(worldLedger);
  const recentFacts = getRelevantFacts(ledger, { limit });

  const lines = [];

  if (recentFacts.length > 0) {
    lines.push('FAKTA DUNIA & PERISTIWA PENTING:');
    for (const f of recentFacts) {
      lines.push(`- [Turn ${f.turn}] ${f.description}`);
    }
  }

  const activeFlags = Object.entries(ledger.flags)
    .filter(([_, v]) => Boolean(v))
    .map(([k]) => k);

  if (activeFlags.length > 0) {
    lines.push(`STATUS DUNIA AKTIF: ${activeFlags.join(', ')}`);
  }

  const activeRep = Object.entries(ledger.reputation)
    .filter(([_, v]) => v !== 0)
    .map(([k, v]) => `${k} (${v > 0 ? '+' : ''}${v})`);

  if (activeRep.length > 0) {
    lines.push(`REPUTASI FRAKSI: ${activeRep.join(', ')}`);
  }

  return lines.join('\n');
}

module.exports = {
  normalizeLedger,
  generateFactId,
  addFact,
  hasFact,
  setFlag,
  getFlag,
  updateReputation,
  getRelevantFacts,
  summarizeForPrompt
};
