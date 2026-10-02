/**
 * Saving Throw Evaluator for AetherMaster AI
 * Implements D&D 5E Saving Throw Mechanics and Status Condition checks.
 */

const { getEffectiveStats, calculateModifier } = require('../utils/statEngine');

/**
 * Checks if a character has a specific status effect.
 * Supports strings (e.g. 'blessed', 'poisoned', 'stunned') and objects ({ type: 'blessed' } or { name: 'blessed' }).
 */
function hasStatusEffect(character, effectName) {
  if (!character || !Array.isArray(character.statusEffects)) return false;
  const target = String(effectName).toLowerCase().trim();
  return character.statusEffects.some(effect => {
    if (typeof effect === 'string') {
      return effect.toLowerCase().trim() === target;
    }
    if (effect && typeof effect === 'object') {
      const name = effect.type || effect.name || effect.id || effect.status;
      return String(name).toLowerCase().trim() === target;
    }
    return false;
  });
}

/**
 * Roll a die with N sides.
 */
function rollDice(sides = 20) {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Calculates Spell Save DC for a caster according to D&D 5E rules:
 * DC = 8 + proficiencyBonus (2 + floor((level - 1) / 4)) + abilityModifier
 */
function calculateSpellSaveDC(character, ability = 'int') {
  const effective = getEffectiveStats(character);
  const level = character?.level || 1;
  const profBonus = 2 + Math.floor((Math.max(1, level) - 1) / 4);
  const mod = effective.modifiers?.[ability.toLowerCase()] || calculateModifier(character?.[ability.toLowerCase()] || 10);
  return 8 + profBonus + mod;
}

/**
 * Evaluates a D&D 5E Saving Throw.
 * D20 + ability modifier + blessed bonus (1d4 if blessed) vs DC.
 *
 * @param {Object} options
 * @param {Object} options.character - Character object or sequelize model
 * @param {string} options.ability - 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
 * @param {number} options.dc - Difficulty Class (target number to match or beat)
 * @param {number} [options.rollOverride] - Specific d20 roll for deterministic testing
 * @param {number} [options.blessedRollOverride] - Specific d4 roll for blessed bonus
 * @returns {Object} Detailed evaluation outcome
 */
function evaluateSavingThrow({
  character,
  ability = 'dex',
  dc = 12,
  rollOverride = null,
  blessedRollOverride = null
}) {
  const normAbility = String(ability).toLowerCase().trim();
  const effective = getEffectiveStats(character);
  const mod = effective.modifiers?.[normAbility] !== undefined
    ? effective.modifiers[normAbility]
    : calculateModifier(character?.[normAbility] || 10);

  const d20 = rollOverride !== null && rollOverride !== undefined
    ? rollOverride
    : rollDice(20);

  const isBlessed = hasStatusEffect(character, 'blessed');
  let blessedBonus = 0;
  if (isBlessed) {
    blessedBonus = blessedRollOverride !== null && blessedRollOverride !== undefined
      ? blessedRollOverride
      : rollDice(4);
  }

  const total = d20 + mod + blessedBonus;
  const isCritSuccess = d20 === 20;
  const isCritFailure = d20 === 1;

  // In D&D 5E saving throws, natural 20 is not automatically a critical unless rule variant,
  // but total >= dc determines success. If d20 === 20, total usually easily beats DC.
  const success = isCritSuccess || (d20 !== 1 && total >= dc);

  const charName = character?.name || 'Karakter';
  const abilityUpper = normAbility.toUpperCase();
  const blessedText = isBlessed ? ` + 1d4(blessed: ${blessedBonus})` : '';

  const log = success
    ? `${charName} berhasil dalam ${abilityUpper} Saving Throw (D20: ${d20} + Mod: ${mod}${blessedText} = ${total} vs DC ${dc})!`
    : `${charName} gagal dalam ${abilityUpper} Saving Throw (D20: ${d20} + Mod: ${mod}${blessedText} = ${total} vs DC ${dc})!`;

  return {
    success,
    d20,
    modifier: mod,
    blessedBonus,
    isBlessed,
    total,
    dc,
    ability: normAbility,
    isCritSuccess,
    isCritFailure,
    log
  };
}

module.exports = {
  hasStatusEffect,
  evaluateSavingThrow,
  calculateSpellSaveDC,
  rollDice
};
