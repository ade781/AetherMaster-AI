/**
 * Legacy Resolution Engine (Dice mechanics deprecated and removed).
 * Replaced by pure deterministic narrative resolution.
 */

function calculateModifier(score = 10) {
  return Math.floor((score - 10) / 2);
}

function rollDice() {
  return 10;
}

function performCheck() {
  return {
    roll: 10,
    rolls: null,
    modifier: 0,
    total: 10,
    dc: 10,
    statType: 'NARRATIVE',
    isSuccess: true,
    isNat20: false,
    isNat1: false
  };
}

function performCombatAttack({ attackerName = 'Penyerang', targetName = 'Target' } = {}) {
  return {
    isHit: true,
    isCrit: false,
    isFumble: false,
    attackRoll: 10,
    attackBonus: 0,
    totalAttack: 10,
    targetAC: 10,
    damageDealt: 8,
    log: `${attackerName} melancarkan serangan terarah ke ${targetName}.`
  };
}

function detectActionStatAndDC() {
  return { statType: 'NARRATIVE', dc: 10 };
}

module.exports = {
  rollDice,
  calculateModifier,
  performCheck,
  performCombatAttack,
  detectActionStatAndDC
};
