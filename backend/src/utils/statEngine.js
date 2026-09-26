function calculateModifier(score = 10) {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculate effective character stats including passive equipment bonuses.
 * @param {Object} character - Character Sequelize instance or plain object
 * @returns {Object} Effective stats with parsed passive bonuses
 */
function getEffectiveStats(character) {
  if (!character) return {};

  const effective = {
    str: character.str || 10,
    dex: character.dex || 10,
    con: character.con || 10,
    int: character.int || 10,
    wis: character.wis || 10,
    cha: character.cha || 10,
    hp: character.hp || 30,
    maxHp: character.maxHp || 30,
    mana: character.mana || 20,
    maxMana: character.maxMana || 20,
    armorClass: character.armorClass || (10 + calculateModifier(character.dex || 10))
  };

  const equipped = Array.isArray(character.equippedItems) ? character.equippedItems : [];
  const inventory = Array.isArray(character.inventory) ? character.inventory : [];
  const passiveItems = [...equipped, ...inventory.filter(i => i.isPassive || i.category === 'Relik' || i.category === 'Armor' || i.category === 'Senjata')];

  for (const item of passiveItems) {
    if (!item) continue;
    const effectStr = String(item.effect || '').toUpperCase();

    // Match +N STAT patterns e.g. +2 WIS, +1 STR, +2 AC, +5 HP
    const matches = effectStr.matchAll(/([+-]?\d+)\s*(STR|DEX|CON|INT|WIS|CHA|AC|ARMOR CLASS|HP|MANA)/g);
    for (const match of matches) {
      const bonus = parseInt(match[1], 10);
      const statKey = match[2].toLowerCase();

      if (statKey === 'ac' || statKey === 'armor class') {
        effective.armorClass += bonus;
      } else if (statKey === 'hp') {
        effective.maxHp += bonus;
      } else if (statKey === 'mana') {
        effective.maxMana += bonus;
      } else if (effective[statKey] !== undefined) {
        effective[statKey] += bonus;
      }
    }
  }

  // Calculate corresponding modifiers
  effective.modifiers = {
    str: calculateModifier(effective.str),
    dex: calculateModifier(effective.dex),
    con: calculateModifier(effective.con),
    int: calculateModifier(effective.int),
    wis: calculateModifier(effective.wis),
    cha: calculateModifier(effective.cha)
  };

  return effective;
}

module.exports = {
  getEffectiveStats,
  calculateModifier
};
