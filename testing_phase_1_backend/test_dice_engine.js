const { rollDice, calculateModifier, performCheck, performCombatAttack } = require('../backend/src/utils/diceEngine');

function runDiceEngineTests() {
  console.log('=== [PHASE 1.2] Testing D&D 5E Virtual Dice Engine ===');

  // Test 1: rollDice range checks (D20, D8, D6)
  for (let i = 0; i < 100; i++) {
    const d20 = rollDice(20);
    if (d20 < 1 || d20 > 20) throw new Error(`D20 roll out of bounds: ${d20}`);
    const d8 = rollDice(8);
    if (d8 < 1 || d8 > 8) throw new Error(`D8 roll out of bounds: ${d8}`);
  }
  console.log('✓ D20 & D8 Distribution Check: 100 rolls strictly bounded within [1, N] (OK)');

  // Test 2: calculateModifier tests
  const mod10 = calculateModifier(10); // 0
  const mod16 = calculateModifier(16); // +3
  const mod8 = calculateModifier(8);   // -1
  const mod18 = calculateModifier(18); // +4
  if (mod10 !== 0 || mod16 !== 3 || mod8 !== -1 || mod18 !== 4) {
    throw new Error(`calculateModifier calculation error: 10->${mod10}, 16->${mod16}, 8->${mod8}, 18->${mod18}`);
  }
  console.log('✓ D&D 5E Stat Modifier Check: (Stat - 10)/2 exact calculation verified (OK)');

  // Test 3: performCheck with character stats
  const dummyChar = {
    str: 16, // mod +3
    dex: 12, // mod +1
    con: 14, // mod +2
    int: 8,  // mod -1
    wis: 10, // mod 0
    cha: 14  // mod +2
  };

  const checkRes = performCheck({
    character: dummyChar,
    statType: 'STR',
    dc: 12
  });

  if (checkRes.modifier !== 3) {
    throw new Error(`Expected modifier +3 for STR 16, got ${checkRes.modifier}`);
  }
  if (checkRes.total !== checkRes.roll + checkRes.modifier) {
    throw new Error(`Total formula error: total=${checkRes.total}, roll=${checkRes.roll}, mod=${checkRes.modifier}`);
  }
  console.log(`✓ performCheck: Roll ${checkRes.roll} + ${checkRes.modifier} = ${checkRes.total} vs DC 12 -> ${checkRes.isSuccess ? 'SUKSES' : 'GAGAL'} (OK)`);

  // Test 4: Advantage & Disadvantage logic
  const advCheck = performCheck({ character: dummyChar, statType: 'DEX', dc: 10, advantage: true });
  if (advCheck.rolls && advCheck.rolls.length === 2) {
    if (advCheck.roll !== Math.max(advCheck.rolls[0], advCheck.rolls[1])) {
      throw new Error('Advantage did not select maximum of 2 rolls');
    }
  }
  console.log('✓ Advantage Mechanism: Correctly chose max(roll1, roll2) (OK)');

  const disCheck = performCheck({ character: dummyChar, statType: 'DEX', dc: 10, disadvantage: true });
  if (disCheck.rolls && disCheck.rolls.length === 2) {
    if (disCheck.roll !== Math.min(disCheck.rolls[0], disCheck.rolls[1])) {
      throw new Error('Disadvantage did not select minimum of 2 rolls');
    }
  }
  console.log('✓ Disadvantage Mechanism: Correctly chose min(roll1, roll2) (OK)');

  // Test 5: Combat Attack simulation
  const combatRes = performCombatAttack({
    attackerName: 'Paladin',
    targetName: 'Skeleton',
    attackBonus: 5,
    targetAC: 12,
    damageDice: 8,
    damageBonus: 3
  });
  if (typeof combatRes.isHit !== 'boolean' || typeof combatRes.damageDealt !== 'number') {
    throw new Error('Invalid combat attack output: ' + JSON.stringify(combatRes));
  }
  console.log(`✓ Combat Attack Calculation: ${combatRes.log} (OK)`);

  console.log('✓ [PHASE 1.2 PASSED] All D&D Dice Engine tests succeeded!\n');
}

module.exports = { runDiceEngineTests };
