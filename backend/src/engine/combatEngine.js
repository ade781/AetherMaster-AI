/**
 * Server-Side Combat Engine for AetherMaster AI (Agent 3)
 * Implements deterministic, rules-based D&D 5E tactical combat.
 * Rejects phantom encounters, validates all rolls on the server,
 * and maintains combat lifecycle (ACTIVE, VICTORY, DEFEAT).
 */

const { getEffectiveStats } = require('../utils/statEngine');
const { hasStatusEffect, evaluateSavingThrow, calculateSpellSaveDC } = require('./savingThrowEvaluator');

/**
 * Validates whether the current story node or session has an active combat encounter.
 * Rejects stealth / phantom combat without explicit combatEncounter data.
 */
function validateCombatEncounter(session, currentNode) {
  // If session already has an active combat state in progress, it's valid
  if (session?.combatState && session.combatState.inCombat && session.combatState.enemy) {
    return {
      valid: true,
      encounter: session.combatState.enemy,
      isOngoing: true
    };
  }

  // Otherwise, inspect currentNode.combatEncounter
  const enc = currentNode?.combatEncounter;
  if (!enc) {
    return {
      valid: false,
      error: 'Tidak ada encounter pertarungan aktif di adegan saat ini.'
    };
  }

  // Combat encounter must define at least enemy name or enemy ID and positive HP
  const enemyName = enc.enemyName || enc.name;
  const enemyHp = Number(enc.enemyHp || enc.hp || enc.maxHp);

  if (!enemyName || !enemyHp || enemyHp <= 0) {
    return {
      valid: false,
      error: 'Data musuh pada encounter pertarungan tidak valid atau musuh sudah dikalahkan.'
    };
  }

  return {
    valid: true,
    encounter: enc,
    isOngoing: false
  };
}

/**
 * Initializes a new combat state from a valid encounter.
 */
function initCombatState(encounter, existingState = null) {
  if (existingState && existingState.inCombat && existingState.enemy) {
    return existingState;
  }

  const maxHp = Number(encounter.enemyHp || encounter.enemyMaxHp || encounter.maxHp || encounter.hp || 30);
  const ac = Number(encounter.enemyAc || encounter.ac || 12);
  const attackBonus = Number(encounter.attackBonus || encounter.enemyAttack || 3);
  const damageBonus = Number(encounter.damageBonus || 2);
  const damageDice = Number(encounter.damageDice || 6);

  return {
    inCombat: true,
    round: 1,
    enemy: {
      id: encounter.enemyId || encounter.id || 'encounter_enemy',
      name: encounter.enemyName || encounter.name || 'Musuh',
      hp: maxHp,
      maxHp: maxHp,
      ac: ac,
      attackBonus: attackBonus,
      damageBonus: damageBonus,
      damageDice: damageDice,
      sprite: encounter.sprite || encounter.enemySprite || 'monster_01_skeleton',
      goldReward: Number(encounter.goldReward || encounter.gold || 25),
      loot: encounter.loot || null
    },
    combatLog: [
      `Pertempuran dimulai! ${encounter.enemyName || encounter.name || 'Musuh'} (AC ${ac}) siap menyerang.`
    ]
  };
}

/**
 * Roll a dice (e.g. 1d20, 1d8)
 */
function rollDice(sides = 20) {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Executes a single turn of tactical combat deterministically on the server.
 * Handles player action followed by enemy counter-attack if enemy survives.
 */
function executeCombatAction({ session, character, currentNode, action = 'ATTACK', itemId = null }) {
  // Step 1: Validate encounter
  const validation = validateCombatEncounter(session, currentNode);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      statusCode: 400
    };
  }

  // Step 2: Ensure combat state initialized
  let combatState = session.combatState;
  if (!combatState || !combatState.inCombat || !combatState.enemy) {
    combatState = initCombatState(validation.encounter, combatState);
  }

  const effectiveChar = getEffectiveStats(character);
  const upperAction = String(action).toUpperCase();
  const enemy = combatState.enemy;

  // --- Step 2.1: Turn-based Status Effect: Poisoned ---
  // Takes 1d4 damage over time at start of turn
  if (hasStatusEffect(character, 'poisoned')) {
    const poisonDmg = rollDice(4);
    character.hp = Math.max(0, character.hp - poisonDmg);
    const poisonLog = `Ronde ${combatState.round}: Efek racun (Poisoned) menggerogoti tubuh ${character.name}, menorehkan ${poisonDmg} damage! (Sisa HP: ${character.hp}/${character.maxHp})`;
    combatState.combatLog.unshift(poisonLog);

    if (character.hp <= 0) {
      character.hp = 0;
      session.isGameOver = true;
      combatState.inCombat = false;
      combatState.isDefeat = true;
      const defeatLog = `💀 ${character.name} tumbang binasa akibat racun mematikan... Game Over.`;
      combatState.combatLog.unshift(defeatLog);

      return {
        success: true,
        combatState,
        character,
        session,
        isGameOver: true,
        isVictory: false,
        isFled: false,
        actionLog: `${poisonLog}\n${defeatLog}`
      };
    }
  }

  let playerTurnResult = {
    action: upperAction,
    success: false,
    hit: false,
    crit: false,
    damageDealt: 0,
    healAmount: 0,
    manaSpent: 0,
    log: ''
  };

  // --- Step 2.2: Turn-based Status Effect: Stunned ---
  // Skips player action completely
  const isStunned = hasStatusEffect(character, 'stunned');
  if (isStunned) {
    playerTurnResult = {
      action: 'STUNNED',
      success: true,
      hit: false,
      crit: false,
      damageDealt: 0,
      healAmount: 0,
      manaSpent: 0,
      log: `Ronde ${combatState.round}: ${character.name} tertegun (Stunned) dan tidak berdaya mengambil tindakan pada giliran ini!`
    };
    combatState.combatLog.unshift(playerTurnResult.log);
  } else if (upperAction === 'ATTACK') {
    // Step 3: Execute Player Action
    const d20 = rollDice(20);
    const strMod = effectiveChar.modifiers?.str || Math.floor(((character.str || 10) - 10) / 2);
    const isBlessed = hasStatusEffect(character, 'blessed');
    const blessedBonus = isBlessed ? rollDice(4) : 0;
    const attackRoll = d20 + strMod + blessedBonus;
    const isCrit = d20 === 20;
    const isHit = isCrit || (d20 !== 1 && attackRoll >= enemy.ac);
    const blessedText = isBlessed ? `+${blessedBonus}(blessed)` : '';

    if (isHit) {
      const baseDmg = rollDice(8) + Math.max(1, strMod);
      const finalDmg = isCrit ? (baseDmg * 2) : baseDmg;
      enemy.hp = Math.max(0, enemy.hp - finalDmg);

      playerTurnResult = {
        action: 'ATTACK',
        success: true,
        hit: true,
        crit: isCrit,
        damageDealt: finalDmg,
        healAmount: 0,
        manaSpent: 0,
        log: `Ronde ${combatState.round}: ${isCrit ? 'CRITICAL HIT! ' : ''}${character.name} melancarkan tebasan presisi (D20: ${d20}+${strMod}${blessedText}=${attackRoll} vs AC ${enemy.ac}), menorehkan ${finalDmg} damage pada ${enemy.name}!`
      };
    } else {
      playerTurnResult = {
        action: 'ATTACK',
        success: true,
        hit: false,
        crit: false,
        damageDealt: 0,
        healAmount: 0,
        manaSpent: 0,
        log: `Ronde ${combatState.round}: Ayunan senjata ${character.name} meleset (D20: ${d20}+${strMod}${blessedText}=${attackRoll} vs AC ${enemy.ac}) dari celah pertahanan ${enemy.name}.`
      };
    }
    combatState.combatLog.unshift(playerTurnResult.log);
  } else if (upperAction === 'CAST_SPELL') {
    const MANA_COST = 5;
    if ((character.mana || 0) < MANA_COST) {
      return {
        success: false,
        error: `Mana tidak mencukupi untuk merapal sihir (butuh min. ${MANA_COST} Mana)!`,
        statusCode: 400
      };
    }

    character.mana = Math.max(0, character.mana - MANA_COST);
    const spellMod = Math.max(
      effectiveChar.modifiers?.int || 0,
      effectiveChar.modifiers?.wis || 0,
      effectiveChar.modifiers?.cha || 0
    );

    // Spell: Fireball / Arcane Burst (2d6 + spellMod)
    const d6_1 = rollDice(6);
    const d6_2 = rollDice(6);
    const spellDmg = d6_1 + d6_2 + Math.max(2, spellMod * 2);
    enemy.hp = Math.max(0, enemy.hp - spellDmg);

    playerTurnResult = {
      action: 'CAST_SPELL',
      success: true,
      hit: true,
      crit: false,
      damageDealt: spellDmg,
      healAmount: 0,
      manaSpent: MANA_COST,
      log: `Ronde ${combatState.round}: ${character.name} merapal ledakan sihir arkanum (-${MANA_COST} Mana) membakar ${enemy.name} sebesar ${spellDmg} damage sihir!`
    };
    combatState.combatLog.unshift(playerTurnResult.log);

  } else if (upperAction === 'USE_ITEM') {
    const inv = Array.isArray(character.inventory) ? [...character.inventory] : [];
    const itemIndex = inv.findIndex(i => i && (i.id === itemId || i.name === itemId || (typeof i.id === 'string' && i.id.includes('potion'))));

    if (itemIndex === -1) {
      return {
        success: false,
        error: 'Item tidak ditemukan di dalam inventaris karakter.',
        statusCode: 400
      };
    }

    const item = inv[itemIndex];
    const isPotion = item.category === 'Obat' || item.category === 'Potion' || String(item.id).includes('potion') || String(item.id).includes('heal');

    if (!isPotion) {
      return {
        success: false,
        error: `${item.name || 'Item'} tidak dapat dikonsumsi di tengah pertarungan taktis.`,
        statusCode: 400
      };
    }

    const healAmount = 25;
    character.hp = Math.min(character.maxHp, character.hp + healAmount);
    // Consume item
    inv.splice(itemIndex, 1);
    character.inventory = inv;

    playerTurnResult = {
      action: 'USE_ITEM',
      success: true,
      hit: false,
      crit: false,
      damageDealt: 0,
      healAmount,
      manaSpent: 0,
      log: `Ronde ${combatState.round}: ${character.name} menenggak ${item.name || 'Potion of Healing'} dan memulihkan +${healAmount} HP!`
    };
    combatState.combatLog.unshift(playerTurnResult.log);

  } else if (upperAction === 'FLEE') {
    const dexMod = effectiveChar.modifiers?.dex || Math.floor(((character.dex || 10) - 10) / 2);
    const d20 = rollDice(20);
    const fleeSuccess = (d20 + dexMod) >= 12;

    if (fleeSuccess) {
      combatState.inCombat = false;
      combatState.isFled = true;
      const fleeLog = `Ronde ${combatState.round}: ${character.name} berhasil meloloskan diri dari ${enemy.name} memanfaatkan kelincahan (Roll: ${d20}+${dexMod} >= DC 12)!`;
      combatState.combatLog.unshift(fleeLog);

      return {
        success: true,
        combatState,
        character,
        session,
        isGameOver: false,
        isVictory: false,
        isFled: true,
        actionLog: fleeLog
      };
    } else {
      playerTurnResult = {
        action: 'FLEE',
        success: true,
        hit: false,
        crit: false,
        damageDealt: 0,
        healAmount: 0,
        manaSpent: 0,
        log: `Ronde ${combatState.round}: ${character.name} berusaha melarikan diri tetapi musuh menutup jalur keluar (Roll: ${d20}+${dexMod} < DC 12)!`
      };
      combatState.combatLog.unshift(playerTurnResult.log);
    }
  } else {
    return {
      success: false,
      error: `Aksi pertarungan "${action}" tidak dikenali. Pilih ATTACK, CAST_SPELL, USE_ITEM, atau FLEE.`,
      statusCode: 400
    };
  }

  // Step 4: Check Enemy Defeat (Victory Condition)
  if (enemy.hp <= 0) {
    combatState.inCombat = false;
    combatState.isVictory = true;
    const goldReward = enemy.goldReward || 25;
    character.gold = (character.gold || 0) + goldReward;

    const winLog = `🏆 KEMENANGAN MUTLAK! ${enemy.name} tumbang binasa! Kamu memperoleh +${goldReward} Koin Emas!`;
    combatState.combatLog.unshift(winLog);

    return {
      success: true,
      combatState,
      character,
      session,
      isGameOver: false,
      isVictory: true,
      isFled: false,
      actionLog: `${playerTurnResult.log} ${winLog}`
    };
  }

  // Step 5: Enemy Counter-Attack Turn
  let enemyTurnResult = {
    hit: false,
    damageDealt: 0,
    log: ''
  };

  const enemyD20 = rollDice(20);
  const playerAC = character.armorClass || (10 + (effectiveChar.modifiers?.dex || 0));
  const enemyAttackRoll = enemyD20 + enemy.attackBonus;
  const isEnemyHit = (enemyD20 === 20) || (enemyD20 !== 1 && enemyAttackRoll >= playerAC);

  if (isEnemyHit) {
    const enemyDmg = rollDice(enemy.damageDice || 6) + (enemy.damageBonus || 2);
    character.hp = Math.max(0, character.hp - enemyDmg);

    enemyTurnResult = {
      hit: true,
      damageDealt: enemyDmg,
      log: `${enemy.name} melancarkan serangan balasan ganas (D20: ${enemyD20}+${enemy.attackBonus}=${enemyAttackRoll} vs AC ${playerAC}), mengakibatkan ${enemyDmg} damage pada ${character.name}!`
    };
  } else {
    enemyTurnResult = {
      hit: false,
      damageDealt: 0,
      log: `${character.name} dengan tangkas menepis serangan balasan ${enemy.name} (D20: ${enemyD20}+${enemy.attackBonus}=${enemyAttackRoll} vs AC ${playerAC})!`
    };
  }

  combatState.combatLog.unshift(enemyTurnResult.log);
  combatState.round += 1;

  // Step 6: Check Player Defeat (Defeat Condition)
  const isPlayerDefeated = character.hp <= 0;
  if (isPlayerDefeated) {
    character.hp = 0;
    session.isGameOver = true;
    combatState.inCombat = false;
    combatState.isDefeat = true;

    const defeatLog = `💀 Karaktermu tumbang tak bernyawa akibat hantaman ${enemy.name}... Game Over.`;
    combatState.combatLog.unshift(defeatLog);
  }

  return {
    success: true,
    combatState,
    character,
    session,
    isGameOver: isPlayerDefeated,
    isVictory: false,
    isFled: false,
    playerDamageDealt: playerTurnResult.damageDealt,
    enemyDamageDealt: enemyTurnResult.damageDealt,
    actionLog: `${playerTurnResult.log}\n${enemyTurnResult.log}`
  };
}

module.exports = {
  validateCombatEncounter,
  initCombatState,
  executeCombatAction,
  rollDice,
  hasStatusEffect,
  evaluateSavingThrow,
  calculateSpellSaveDC
};

