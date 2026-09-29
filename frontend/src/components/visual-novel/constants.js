/**
 * Visual Novel Asset Mappings & Ambient Sound Resolution
 */

export const BACKGROUND_MAP = {
  bg_01: 'bg_01_tavern',
  bg_01_tavern: 'bg_01_tavern',
  bg_02: 'bg_02_cursed_woods',
  bg_02_cursed_woods: 'bg_02_cursed_woods',
  bg_03: 'bg_03_sunken_citadel',
  bg_03_sunken_citadel: 'bg_03_sunken_citadel',
  bg_04: 'bg_04_crimson_crypt',
  bg_04_crimson_crypt: 'bg_04_crimson_crypt',
  bg_05: 'bg_05_vampire_castle',
  bg_05_vampire_castle: 'bg_05_vampire_castle',
  bg_06: 'bg_06_alchemy_lab',
  bg_06_alchemy_lab: 'bg_06_alchemy_lab',
  bg_07: 'bg_07_smuggler_cave',
  bg_07_smuggler_cave: 'bg_07_smuggler_cave',
  bg_08: 'bg_08_arcane_library',
  bg_08_arcane_library: 'bg_08_arcane_library',
  bg_09: 'bg_09_dragon_crater',
  bg_09_dragon_crater: 'bg_09_dragon_crater',
  bg_10: 'bg_10_ancient_ruins',
  bg_10_ancient_ruins: 'bg_10_ancient_ruins',
  bg_11: 'bg_11_throne_room',
  bg_11_throne_room: 'bg_11_throne_room',
  bg_12: 'bg_12_underdark_cavern',
  bg_12_underdark_cavern: 'bg_12_underdark_cavern',
  bg_13: 'bg_13_lava_forge',
  bg_13_lava_forge: 'bg_13_lava_forge',
  bg_14: 'bg_14_frost_peak',
  bg_14_frost_peak: 'bg_14_frost_peak',
  bg_15: 'bg_15_haunted_graveyard',
  bg_15_haunted_graveyard: 'bg_15_haunted_graveyard',
  bg_16: 'bg_16_swamp_huts',
  bg_16_swamp_huts: 'bg_16_swamp_huts',
  bg_17: 'bg_17_desert_temple',
  bg_17_desert_temple: 'bg_17_desert_temple',
  bg_18: 'bg_18_celestial_sanctum',
  bg_18_celestial_sanctum: 'bg_18_celestial_sanctum',
  bg_19: 'bg_19_shadowfell_citadel',
  bg_19_shadowfell_citadel: 'bg_19_shadowfell_citadel',
  bg_20: 'bg_20_pirate_ship_deck',
  bg_20_pirate_ship_deck: 'bg_20_pirate_ship_deck',
  bg_21: 'bg_21_goblin_war_camp',
  bg_21_goblin_war_camp: 'bg_21_goblin_war_camp',
  bg_22: 'bg_22_crystal_mines',
  bg_22_crystal_mines: 'bg_22_crystal_mines',
  bg_23: 'bg_23_dungeon_torture_chamber',
  bg_23_dungeon_torture_chamber: 'bg_23_dungeon_torture_chamber',
  bg_24: 'bg_24_feywild_glade',
  bg_24_feywild_glade: 'bg_24_feywild_glade',
  bg_25: 'bg_25_abandoned_cathedral',
  bg_25_abandoned_cathedral: 'bg_25_abandoned_cathedral',
  bg_26: 'bg_26_clockwork_vault',
  bg_26_clockwork_vault: 'bg_26_clockwork_vault',
  bg_27: 'bg_27_dragon_hoard',
  bg_27_dragon_hoard: 'bg_27_dragon_hoard',
  bg_28: 'bg_28_city_market_alley',
  bg_28_city_market_alley: 'bg_28_city_market_alley',
  bg_29: 'bg_29_abyssal_rift',
  bg_29_abyssal_rift: 'bg_29_abyssal_rift'
};

export const PORTRAIT_MAP = {
  char_hero_01: 'char_hero_01_paladin',
  char_hero_01_paladin: 'char_hero_01_paladin',
  char_hero_02: 'char_hero_02_ranger',
  char_hero_02_ranger: 'char_hero_02_ranger',
  char_hero_03: 'char_hero_03_wizard',
  char_hero_03_wizard: 'char_hero_03_wizard',
  char_hero_04: 'char_hero_04_dwarf',
  char_hero_04_dwarf: 'char_hero_04_dwarf',
  char_hero_05: 'char_hero_05_rogue',
  char_hero_05_rogue: 'char_hero_05_rogue',
  char_hero_06: 'char_hero_06_cleric',
  char_hero_06_cleric: 'char_hero_06_cleric',
  char_hero_07: 'char_hero_07_warlock',
  char_hero_07_warlock: 'char_hero_07_warlock',
  char_hero_08: 'char_hero_08_dragonborn',
  char_hero_08_dragonborn: 'char_hero_08_dragonborn',
  char_hero_09: 'char_hero_09_bard',
  char_hero_09_bard: 'char_hero_09_bard',
  char_npc_01: 'char_npc_01_barkeep',
  char_npc_01_barkeep: 'char_npc_01_barkeep',
  char_npc_02: 'char_npc_02_informant',
  char_npc_02_informant: 'char_npc_02_informant',
  char_npc_03: 'char_npc_03_vampire',
  char_npc_03_vampire: 'char_npc_03_vampire',
  char_npc_04: 'char_npc_04_necromancer',
  char_npc_04_necromancer: 'char_npc_04_necromancer',
  char_npc_05: 'char_npc_05_dryad',
  char_npc_05_dryad: 'char_npc_05_dryad',
  char_npc_06: 'char_npc_06_goblin',
  char_npc_06_goblin: 'char_npc_06_goblin',
  char_npc_07: 'char_npc_07_guard',
  char_npc_07_guard: 'char_npc_07_guard',
  char_npc_08: 'char_npc_08_cultist',
  char_npc_08_cultist: 'char_npc_08_cultist',
  char_npc_09: 'char_npc_09_lich',
  char_npc_09_lich: 'char_npc_09_lich'
};

export function resolveSceneAmbient(bgId) {
  const clean = (bgId || '').toLowerCase();
  if (clean.includes('dragon') || clean.includes('lava') || clean.includes('war_camp') || clean.includes('boss')) return 'boss';
  if (clean.includes('arcane') || clean.includes('celestial') || clean.includes('feywild') || clean.includes('crystal') || clean.includes('alchemy')) return 'mystic';
  if (clean.includes('ruins') || clean.includes('temple') || clean.includes('sunken') || clean.includes('vault') || clean.includes('smuggler') || clean.includes('pirate')) return 'exploration';
  if (clean.includes('graveyard') || clean.includes('vampire') || clean.includes('shadowfell') || clean.includes('torture') || clean.includes('swamp')) return 'graveyard';
  if (clean.includes('crypt') || clean.includes('dungeon') || clean.includes('cavern') || clean.includes('underdark') || clean.includes('frost')) return 'dungeon';
  return 'tavern';
}

export function resolveBackgroundPath(bgId, campaign) {
  if (bgId && (bgId.startsWith('http') || bgId.startsWith('data:') || bgId.startsWith('/assets/'))) {
    return bgId;
  }
  if (campaign?.coverImage && (campaign.coverImage.startsWith('http') || campaign.coverImage.startsWith('data:'))) {
    if (!bgId || bgId === 'bg_01_tavern' || bgId === campaign.defaultBackgroundId) {
      return campaign.coverImage;
    }
  }

  let resolved = bgId || campaign?.defaultBackgroundId || 'bg_01_tavern';
  if (resolved.startsWith('/') || resolved.startsWith('http') || resolved.startsWith('data:')) return resolved;

  const clean = resolved.replace(/\.png$/i, '');
  const mapped = BACKGROUND_MAP[clean] || clean;
  return `/assets/backgrounds/${mapped}.png`;
}

export function resolvePortraitPath(charId) {
  if (!charId) return null;
  if (charId.startsWith('/') || charId.startsWith('http') || charId.startsWith('data:')) return charId;
  const clean = charId.replace(/\.png$/i, '');
  const mapped = PORTRAIT_MAP[clean] || clean;
  return `/assets/portraits/${mapped}.png`;
}
