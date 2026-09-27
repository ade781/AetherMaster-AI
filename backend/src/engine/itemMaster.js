/**
 * Item Master Catalog & Engine
 * Single Source of Truth for Item Definitions, Effects, and Mutations.
 * Synchronized with Database Item records.
 */

const { itemsData } = require('../models/seeders/worldDataSeeder');

// Populate canonical catalog from master seeded data
const ITEM_CATALOG = {};
for (const item of itemsData) {
  ITEM_CATALOG[item.id] = {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    rarity: item.rarity,
    icon: item.icon,
    maxStack: item.maxStack || 10,
    consumable: item.isConsumable ?? (item.category === 'consumable' || item.category === 'Obat'),
    isConsumable: item.isConsumable ?? (item.category === 'consumable' || item.category === 'Obat'),
    isUsable: item.isUsable ?? true,
    effectType: item.effectType,
    effectValue: item.effectValue,
    effect: {
      hp: item.metadata?.hp || (item.effectType === 'HEAL_HP' ? item.effectValue : 0),
      mana: item.metadata?.mana || (item.effectType === 'RESTORE_MANA' ? item.effectValue : 0),
      gold: item.metadata?.gold || (item.effectType === 'ADD_GOLD' ? item.effectValue : 0),
      description: item.description || ''
    },
    metadata: item.metadata || {}
  };
}

// Aliases mapping for common colloquial or legacy item names
const ITEM_ALIASES = {
  // Potion heal variations
  'item_01_health_potion': 'item_01_potion_heal',
  'potion_heal': 'item_01_potion_heal',
  'health_potion': 'item_01_potion_heal',
  'potion of healing': 'item_01_potion_heal',
  'ramuan pemulih': 'item_01_potion_heal',
  'potion': 'item_01_potion_heal',
  'health potion': 'item_01_potion_heal',

  // Potion mana variations
  'item_02_mana_potion': 'item_02_potion_mana',
  'mana_potion': 'item_02_potion_mana',
  'celestial mana elixir': 'item_02_potion_mana',
  'mana elixir': 'item_02_potion_mana',
  'ramuan mana': 'item_02_potion_mana',
  'mana potion': 'item_02_potion_mana',

  // Crown variations
  'item_golden_crown': 'item_16_crown_kings',
  'golden crown': 'item_16_crown_kings',
  'crown of the fallen king': 'item_16_crown_kings',

  // Grimoire
  'ancient grimoire': 'item_03_grimoire',
  'grimoire kuno': 'item_03_grimoire',

  // Skeleton key
  'skeleton key': 'item_06_skeleton_key',
  'kunci tengkorak': 'item_06_skeleton_key',

  // Silver dagger
  'silver dagger': 'item_04_silver_dagger',
  'belati perak': 'item_04_silver_dagger'
};

/**
 * Normalizes any item ID or name into canonical item ID.
 * @param {string} idOrName
 * @returns {string}
 */
function normalizeItemId(idOrName) {
  if (!idOrName || typeof idOrName !== 'string') return '';
  const trimmed = idOrName.trim();
  const lower = trimmed.toLowerCase();

  if (ITEM_CATALOG[trimmed]) return trimmed;
  if (ITEM_CATALOG[lower]) return lower;
  if (ITEM_ALIASES[lower]) return ITEM_ALIASES[lower];

  // Try finding by name in catalog
  for (const [id, def] of Object.entries(ITEM_CATALOG)) {
    if (def.name.toLowerCase() === lower) {
      return id;
    }
  }

  return trimmed;
}

/**
 * Retrieves item definition from canonical catalog.
 * @param {string|object} itemInput
 * @returns {object|null} Cloned item definition or null
 */
function getItem(itemInput) {
  if (!itemInput) return null;
  const id = typeof itemInput === 'object' ? (itemInput.itemId || itemInput.id || itemInput.name) : itemInput;
  const canonicalId = normalizeItemId(id);
  const def = ITEM_CATALOG[canonicalId];
  if (!def) return null;
  return JSON.parse(JSON.stringify(def));
}

/**
 * Checks whether an item is consumable.
 * @param {string|object} itemInput
 * @returns {boolean}
 */
function isConsumable(itemInput) {
  const item = getItem(itemInput);
  if (!item) return false;
  return item.consumable === true || item.isConsumable === true || item.category === 'consumable' || item.category === 'Obat';
}

/**
 * Verifies if character has the requested item in inventory.
 * Supports both canonical `{ itemId, quantity }` and legacy `{ id, name }`.
 *
 * @param {object} character
 * @param {string} itemIdOrName
 * @returns {number} Index in inventory, or -1 if not found
 */
function findItemIndex(character, itemIdOrName) {
  if (!character || !Array.isArray(character.inventory)) return -1;
  const canonicalId = normalizeItemId(itemIdOrName);
  const targetLower = typeof itemIdOrName === 'string' ? itemIdOrName.toLowerCase().trim() : '';

  return character.inventory.findIndex(invItem => {
    if (!invItem) return false;
    const invId = invItem.itemId || invItem.id;
    if (invId) {
      const normalizedInvId = normalizeItemId(invId);
      if (normalizedInvId === canonicalId) return true;
    }
    if (invItem.name && invItem.name.toLowerCase() === targetLower) return true;
    return false;
  });
}

/**
 * Applies a consumable item to a character deterministically.
 * Clamps HP between 0 and maxHp, Mana between 0 and maxMana.
 *
 * @param {object} character - Character object (or plain character data)
 * @param {string} itemIdOrName - Item identifier
 * @returns {object} { success, updatedCharacter, hpRestored, manaRestored, goldGained, message, error }
 */
function applyItem(character, itemIdOrName) {
  if (!character) {
    return { success: false, error: 'Character data is required.' };
  }

  const itemIdx = findItemIndex(character, itemIdOrName);
  if (itemIdx === -1) {
    return {
      success: false,
      error: `Item "${itemIdOrName}" tidak ditemukan di dalam inventaris.`
    };
  }

  const invItem = character.inventory[itemIdx];
  const itemDef = getItem(invItem.itemId || invItem.id || invItem.name) || invItem;

  if (!isConsumable(itemDef)) {
    return {
      success: false,
      error: `${itemDef.name || 'Item'} bukan item konsumsi yang bisa digunakan langsung.`
    };
  }

  const currentHp = Number(character.hp ?? 0);
  const maxHp = Number(character.maxHp ?? 30);
  const currentMana = Number(character.mana ?? 0);
  const maxMana = Number(character.maxMana ?? 20);
  const currentGold = Number(character.gold ?? 0);

  const hpEffect = Number(itemDef.effect?.hp ?? (itemDef.effectType === 'HEAL_HP' ? itemDef.effectValue : 0));
  const manaEffect = Number(itemDef.effect?.mana ?? (itemDef.effectType === 'RESTORE_MANA' ? itemDef.effectValue : 0));
  const goldEffect = Number(itemDef.effect?.gold ?? (itemDef.effectType === 'ADD_GOLD' ? itemDef.effectValue : 0));

  const newHp = Math.min(maxHp, Math.max(0, currentHp + hpEffect));
  const newMana = Math.min(maxMana, Math.max(0, currentMana + manaEffect));
  const newGold = Math.max(0, currentGold + goldEffect);

  const hpRestored = newHp - currentHp;
  const manaRestored = newMana - currentMana;
  const goldGained = newGold - currentGold;

  // Inventory update: decrement quantity if canonical or remove if quantity reaches 0
  const updatedInventory = [...character.inventory];
  const currentQty = Number(invItem.quantity ?? 1);

  if (currentQty > 1) {
    updatedInventory[itemIdx] = {
      ...invItem,
      itemId: invItem.itemId || invItem.id,
      quantity: currentQty - 1
    };
  } else {
    updatedInventory.splice(itemIdx, 1);
  }

  const updatedCharacter = {
    ...character,
    hp: newHp,
    mana: newMana,
    gold: newGold,
    inventory: updatedInventory
  };

  const messageParts = [];
  if (hpRestored > 0) messageParts.push(`+${hpRestored} HP`);
  if (hpRestored < 0) messageParts.push(`${hpRestored} HP`);
  if (manaRestored > 0) messageParts.push(`+${manaRestored} Mana`);
  if (goldGained > 0) messageParts.push(`+${goldGained} Gold`);

  const effectSummary = messageParts.length > 0 ? ` (${messageParts.join(', ')})` : '';
  const message = `Menggunakan ${itemDef.name || 'item'}${effectSummary}.`;

  return {
    success: true,
    updatedCharacter,
    hpRestored,
    manaRestored,
    goldGained,
    consumedItem: itemDef,
    message
  };
}

/**
 * Adds an item to a character's inventory deterministically.
 * Enforces database registration. Rejects any unknown or fabricated items!
 * Stores inventory in canonical reference format: [{ itemId, quantity }].
 *
 * @param {object} character
 * @param {string|object} itemInput
 * @param {number} count - Quantity to add
 * @returns {object} { success, updatedCharacter, addedItem, error }
 */
function addItem(character, itemInput, count = 1) {
  if (!character) return { success: false, error: 'Character data is required.' };

  const id = typeof itemInput === 'object' ? (itemInput.itemId || itemInput.id || itemInput.name) : itemInput;
  const itemDef = getItem(id);

  if (!itemDef) {
    return {
      success: false,
      error: `Definisi item "${id}" tidak terdaftar di database. Item ditolak.`
    };
  }

  const qtyToAdd = Math.max(1, parseInt(count, 10) || 1);
  const currentInventory = Array.isArray(character.inventory) ? [...character.inventory] : [];

  // Check if item already exists in inventory
  const existingIdx = currentInventory.findIndex(i => {
    if (!i) return false;
    const invId = normalizeItemId(i.itemId || i.id);
    return invId === itemDef.id;
  });

  if (existingIdx !== -1) {
    const existing = currentInventory[existingIdx];
    const prevQty = Number(existing.quantity ?? 1);
    currentInventory[existingIdx] = {
      itemId: itemDef.id,
      quantity: prevQty + qtyToAdd
    };
  } else {
    currentInventory.push({
      itemId: itemDef.id,
      quantity: qtyToAdd
    });
  }

  const updatedCharacter = {
    ...character,
    inventory: currentInventory
  };

  return {
    success: true,
    updatedCharacter,
    addedItem: itemDef
  };
}

module.exports = {
  ITEM_CATALOG,
  ITEM_ALIASES,
  normalizeItemId,
  getItem,
  isConsumable,
  findItemIndex,
  applyItem,
  addItem
};
