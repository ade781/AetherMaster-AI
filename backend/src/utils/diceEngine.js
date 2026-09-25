/**
 * D&D 5E Virtual Dice Engine & Resolution Engine
 * Server-authoritative calculations for skill checks and tactical combat.
 */

function rollDice(sides = 20) {
  return Math.floor(Math.random() * sides) + 1;
}

function calculateModifier(score = 10) {
  return Math.floor((score - 10) / 2);
}

function performCheck({ character = {}, statType = 'STR', dc = 10, advantage = false, disadvantage = false } = {}) {
  const normalizedStat = (statType || 'STR').toLowerCase();
  const statScore = typeof character[normalizedStat] === 'number' ? character[normalizedStat] : 10;
  const modifier = calculateModifier(statScore);

  let roll = 0;
  let rolls = null;

  if (advantage && !disadvantage) {
    const r1 = rollDice(20);
    const r2 = rollDice(20);
    rolls = [r1, r2];
    roll = Math.max(r1, r2);
  } else if (disadvantage && !advantage) {
    const r1 = rollDice(20);
    const r2 = rollDice(20);
    rolls = [r1, r2];
    roll = Math.min(r1, r2);
  } else {
    roll = rollDice(20);
  }

  const total = roll + modifier;
  const isNat20 = roll === 20;
  const isNat1 = roll === 1;
  const isSuccess = isNat20 || (!isNat1 && total >= dc);

  return {
    roll,
    rolls,
    modifier,
    total,
    dc,
    statType: statType.toUpperCase(),
    isSuccess,
    isNat20,
    isNat1
  };
}

function performCombatAttack({
  attackerName = 'Penyerang',
  targetName = 'Target',
  attackBonus = 0,
  targetAC = 10,
  damageDice = 6,
  damageBonus = 0
} = {}) {
  const attackRoll = rollDice(20);
  const isCrit = attackRoll === 20;
  const isFumble = attackRoll === 1;
  const totalAttack = attackRoll + attackBonus;
  const isHit = isCrit || (!isFumble && totalAttack >= targetAC);

  let damageDealt = 0;
  if (isHit) {
    let dRoll = rollDice(damageDice);
    if (isCrit) {
      dRoll += rollDice(damageDice);
    }
    damageDealt = Math.max(1, dRoll + damageBonus);
  }

  const resultText = isCrit
    ? `CRITICAL HIT! Menghasilkan ${damageDealt} damage!`
    : isHit
    ? `KENA! Menghasilkan ${damageDealt} damage.`
    : isFumble
    ? 'CRITICAL MISS! Serangan meleset jauh.'
    : 'MELESET!';

  const log = `${attackerName} menyerang ${targetName}: D20(${attackRoll}) + ${attackBonus} = ${totalAttack} vs AC ${targetAC}. ${resultText}`;

  return {
    isHit,
    isCrit,
    isFumble,
    attackRoll,
    attackBonus,
    totalAttack,
    targetAC,
    damageDealt,
    log
  };
}

module.exports = {
  rollDice,
  calculateModifier,
  performCheck,
  performCombatAttack
};
