/**
 * Item Master Catalog & Engine
 * Single Source of Truth for Item Definitions, Effects, and Mutations.
 */

const ITEM_CATALOG = {
  item_01_potion_heal: {
    id: 'item_01_potion_heal',
    name: 'Potion of Healing',
    category: 'consumable',
    effect: {
      hp: 25,
      mana: 0,
      gold: 0,
      description: 'Memulihkan 25 HP seketika'
    },
    icon: 'item_01_potion_heal',
    consumable: true,
    sellPrice: 15,
    buyPrice: 30
  },
  item_02_potion_mana: {
    id: 'item_02_potion_mana',
    name: 'Celestial Mana Elixir',
    category: 'consumable',
    effect: {
      hp: 0,
      mana: 25,
      gold: 0,
      description: 'Memulihkan 25 Mana seketika'
    },
    icon: 'item_02_potion_mana',
    consumable: true,
    sellPrice: 20,
    buyPrice: 40
  },
  item_03_grimoire: {
    id: 'item_03_grimoire',
    name: 'Ancient Grimoire',
    category: 'relic',
    effect: {
      maxManaBonus: 15,
      description: '+15 Max Mana dan wawasan magis kuno'
    },
    icon: 'item_03_grimoire',
    consumable: false,
    sellPrice: 100,
    buyPrice: 200
  },
  item_04_silver_dagger: {
    id: 'item_04_silver_dagger',
    name: 'Silver Dagger',
    category: 'weapon',
    effect: {
      attackBonus: 3,
      description: 'Belati perak berdaya tembus tinggi terhadap makhluk kegelapan'
    },
    icon: 'item_04_silver_dagger',
    consumable: false,
    sellPrice: 40,
    buyPrice: 80
  },
  item_05_cursed_amulet: {
    id: 'item_05_cursed_amulet',
    name: 'Blessed Talisman',
    category: 'amulet',
    effect: {
      wardBonus: 2,
      description: 'Jimat perlindungan dari kutukan dan pengaruh sihir kelam'
    },
    icon: 'item_05_cursed_amulet',
    consumable: false,
    sellPrice: 50,
    buyPrice: 100
  },
  item_06_skeleton_key: {
    id: 'item_06_skeleton_key',
    name: 'Skeleton Key',
    category: 'key',
    effect: {
      keyType: 'crypt',
      description: 'Kunci berukir tengkorak yang dapat membuka pintu makam kuno'
    },
    icon: 'item_06_skeleton_key',
    consumable: false,
    sellPrice: 60,
    buyPrice: 120
  },
  item_07_golden_compass: {
    id: 'item_07_golden_compass',
    name: 'Golden Compass',
    category: 'tool',
    effect: {
      wisBonus: 2,
      description: '+2 Wawasan (WIS) saat menjelajahi wilayah tak dikenal'
    },
    icon: 'item_07_golden_compass',
    consumable: false,
    sellPrice: 75,
    buyPrice: 150
  },
  item_08_dragon_shield: {
    id: 'item_08_dragon_shield',
    name: 'Dragon Shield',
    category: 'shield',
    effect: {
      acBonus: 2,
      description: '+2 Armor Class (Pertahanan)'
    },
    icon: 'item_08_dragon_shield',
    consumable: false,
    sellPrice: 80,
    buyPrice: 160
  },
  item_09_gold_pouch: {
    id: 'item_09_gold_pouch',
    name: 'Kantong Emas Saudagar',
    category: 'consumable',
    effect: {
      hp: 0,
      mana: 0,
      gold: 50,
      description: 'Berisi 50 keping emas murni'
    },
    icon: 'item_09_gold_pouch',
    consumable: true,
    sellPrice: 50,
    buyPrice: 50
  },
  item_10_elixir_vitality: {
    id: 'item_10_elixir_vitality',
    name: 'Elixir of Vitality',
    category: 'consumable',
    effect: {
      hp: 50,
      mana: 30,
      gold: 0,
      description: 'Memulihkan 50 HP dan 30 Mana'
    },
    icon: 'item_10_elixir_vitality',
    consumable: true,
    sellPrice: 45,
    buyPrice: 90
  },
  item_11_flame_sword: {
    id: 'item_11_flame_sword',
    name: 'Flame Sword',
    category: 'weapon',
    effect: {
      attackBonus: 5,
      element: 'fire',
      description: '+5 Serangan Api dan memancarkan cahaya di kegelapan'
    },
    icon: 'item_11_flame_sword',
    consumable: false,
    sellPrice: 120,
    buyPrice: 240
  },
  item_12_teleport_scroll: {
    id: 'item_12_teleport_scroll',
    name: 'Gulungan Teleportasi',
    category: 'scroll',
    effect: {
      escapeSuccess: true,
      description: 'Memindahkan pengguna seketika ke tempat aman terdekat'
    },
    icon: 'item_12_teleport_scroll',
    consumable: true,
    sellPrice: 35,
    buyPrice: 70
  },
  item_13_shadow_ring: {
    id: 'item_13_shadow_ring',
    name: 'Shadow Ring',
    category: 'accessory',
    effect: {
      stealthBonus: 3,
      description: 'Memberikan kemampuan menyatu dengan bayang-bayang'
    },
    icon: 'item_13_shadow_ring',
    consumable: false,
    sellPrice: 70,
    buyPrice: 140
  },
  item_14_holy_water: {
    id: 'item_14_holy_water',
    name: 'Air Suci Penyelamat',
    category: 'consumable',
    effect: {
      hp: 15,
      mana: 15,
      undeadPurge: 20,
      description: 'Memulihkan 15 HP & 15 Mana, atau membakar makhluk tak mati'
    },
    icon: 'item_14_holy_water',
    consumable: true,
    sellPrice: 25,
    buyPrice: 50
  },
  item_15_lockpick_set: {
    id: 'item_15_lockpick_set',
    name: 'Peralatan Pembobol Kunci',
    category: 'tool',
    effect: {
      dexBonus: 2,
      description: 'Peralatan presisi untuk membuka peti dan pintu terkunci'
    },
    icon: 'item_15_lockpick_set',
    consumable: false,
    sellPrice: 30,
    buyPrice: 60
  },
  item_16_crown_kings: {
    id: 'item_16_crown_kings',
    name: 'Mahkota Raja Yang Gugur',
    category: 'relic',
    effect: {
      chaBonus: 3,
      description: 'Relik purba yang memancarkan aura wibawa kepemimpinan'
    },
    icon: 'item_16_crown_kings',
    consumable: false,
    sellPrice: 250,
    buyPrice: 500
  },
  item_17_dragon_horn: {
    id: 'item_17_dragon_horn',
    name: 'Dragon War Horn',
    category: 'instrument',
    effect: {
      rallyAllies: true,
      description: 'Memanggil gema arwah sekutu tempur dan meningkatkan moril'
    },
    icon: 'item_17_dragon_horn',
    consumable: false,
    sellPrice: 150,
    buyPrice: 300
  },
  item_18_meat_ration: {
    id: 'item_18_meat_ration',
    name: 'Ransum Daging Pengelana',
    category: 'consumable',
    effect: {
      hp: 10,
      mana: 0,
      gold: 0,
      description: 'Memulihkan 10 HP melalui nutrisi pengelana'
    },
    icon: 'item_18_meat_ration',
    consumable: true,
    sellPrice: 5,
    buyPrice: 10
  },
  item_bone_dagger: {
    id: 'item_bone_dagger',
    name: 'Belati Tulang Purba',
    category: 'weapon',
    effect: {
      attackBonus: 2,
      description: 'Senjata darurat yang diasah dari tulang raksasa'
    },
    icon: 'item_bone_dagger',
    consumable: false,
    sellPrice: 15,
    buyPrice: 30
  },
  item_rapier: {
    id: 'item_rapier',
    name: 'Fine Duelist Rapier',
    category: 'weapon',
    effect: {
      attackBonus: 4,
      dexBonus: 1,
      description: 'Pedang tipis dan fleksibel untuk serangan presisi'
    },
    icon: 'item_rapier',
    consumable: false,
    sellPrice: 70,
    buyPrice: 140
  },
  item_sea_trident: {
    id: 'item_sea_trident',
    name: "Sea King's Trident",
    category: 'weapon',
    effect: {
      attackBonus: 6,
      element: 'water',
      description: 'Senjata pusaka yang dapat mengendalikan aliran ombak'
    },
    icon: 'item_sea_trident',
    consumable: false,
    sellPrice: 180,
    buyPrice: 360
  },
  item_treasure_map: {
    id: 'item_treasure_map',
    name: 'Peta Harta Karun Usang',
    category: 'quest',
    effect: {
      revealsLocation: true,
      description: 'Menunjukkan tanda silang rahasia di kedalaman katakombe'
    },
    icon: 'item_treasure_map',
    consumable: false,
    sellPrice: 50,
    buyPrice: 100
  },
  item_trophy_aether: {
    id: 'item_trophy_aether',
    name: 'Piala Kampiun Aether',
    category: 'quest',
    effect: {
      prestige: 100,
      description: 'Bukti supremasi petualang terhebat di benua Aether'
    },
    icon: 'item_04_silver_dagger',
    consumable: false,
    sellPrice: 500,
    buyPrice: 1000
  }
};

/**
 * ID and Name Aliases Mapping
 * Ensures consistency across legacy versions and different naming conventions.
 */
const ITEM_ALIASES = {
  // Potion heal variations
  'item_01_health_potion': 'item_01_potion_heal',
  'potion of healing': 'item_01_potion_heal',
  'ramuan pemulih': 'item_01_potion_heal',
  'potion': 'item_01_potion_heal',
  'health potion': 'item_01_potion_heal',

  // Potion mana variations
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
 * Normalizes any item ID or name into canonical catalog ID.
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
 * Retrieves item definition from catalog.
 * @param {string|object} itemInput
 * @returns {object|null} Cloned item definition or null
 */
function getItem(itemInput) {
  if (!itemInput) return null;
  const id = typeof itemInput === 'object' ? (itemInput.id || itemInput.name) : itemInput;
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
  return item.consumable === true || item.category === 'consumable';
}

/**
 * Verifies if character has the requested item in inventory.
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
    const invId = invItem.id ? normalizeItemId(invItem.id) : '';
    if (invId && invId === canonicalId) return true;
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
  const itemDef = getItem(invItem.id || invItem.name) || invItem;

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

  const hpEffect = Number(itemDef.effect?.hp ?? 0);
  const manaEffect = Number(itemDef.effect?.mana ?? 0);
  const goldEffect = Number(itemDef.effect?.gold ?? 0);

  const newHp = Math.min(maxHp, Math.max(0, currentHp + hpEffect));
  const newMana = Math.min(maxMana, Math.max(0, currentMana + manaEffect));
  const newGold = Math.max(0, currentGold + goldEffect);

  const hpRestored = newHp - currentHp;
  const manaRestored = newMana - currentMana;
  const goldGained = newGold - currentGold;

  // Remove one instance of consumed item from inventory
  const updatedInventory = [...character.inventory];
  updatedInventory.splice(itemIdx, 1);

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
  const message = `Menggunakan ${itemDef.name}${effectSummary}.`;

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
 * @param {object} character
 * @param {string|object} itemInput
 * @returns {object} { success, updatedCharacter, addedItem }
 */
function addItem(character, itemInput) {
  if (!character) return { success: false, error: 'Character data is required.' };
  const itemDef = getItem(itemInput) || (typeof itemInput === 'object' ? itemInput : null);
  if (!itemDef) {
    return { success: false, error: `Definisi item tidak valid untuk "${itemInput}".` };
  }

  const currentInventory = Array.isArray(character.inventory) ? [...character.inventory] : [];
  currentInventory.push({
    id: itemDef.id,
    name: itemDef.name,
    category: itemDef.category,
    effect: typeof itemDef.effect === 'object' ? (itemDef.effect.description || JSON.stringify(itemDef.effect)) : String(itemDef.effect || ''),
    icon: itemDef.icon || itemDef.id
  });

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
