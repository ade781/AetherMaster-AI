/**
 * Game State Engine
 * Single Source of Truth for Game State Mutations, Validation, Snapshots, and Rewind Persistence.
 */

const itemMaster = require('./itemMaster');
const worldLedgerService = require('./worldLedgerService');
const questEngine = require('./questEngine');

/**
 * Resolves player action and proposed AI state updates deterministically.
 * Clamps stats strictly and guarantees game invariants.
 *
 * @param {object} session - Current GameSession
 * @param {object} character - Current Character
 * @param {object} currentNode - Current StoryNode
 * @param {object} actionIntent - Intent information e.g. { actionType, itemId, choiceId }
 * @param {object} aiStateUpdates - Proposed updates from AI narrative / choice
 * @returns {object} { validatedUpdates, updatedCharacterState, updatedSessionState, isGameOver, gameOverReason }
 */
function resolveAction(session, character, currentNode, actionIntent = {}, aiStateUpdates = {}) {
  let currentHp = Number(character?.hp ?? 30);
  const maxHp = Number(character?.maxHp ?? 30);
  let currentMana = Number(character?.mana ?? 20);
  const maxMana = Number(character?.maxMana ?? 20);
  let currentGold = Number(character?.gold ?? 0);
  let currentInventory = Array.isArray(character?.inventory) ? [...character.inventory] : [];
  let currentWorldLedger = worldLedgerService.normalizeLedger(session?.worldLedger);

  const updates = aiStateUpdates || {};
  let addedItems = [];
  let removedItems = [];

  // 1. Process Item Consumption
  // If intent is USE_ITEM or AI proposed consumedItemId
  const itemToConsume = actionIntent.itemId || updates.consumedItemId || updates.consumedItem;
  if (itemToConsume) {
    const consumeRes = itemMaster.applyItem(
      { hp: currentHp, maxHp, mana: currentMana, maxMana, gold: currentGold, inventory: currentInventory },
      itemToConsume
    );
    if (consumeRes.success) {
      removedItems.push(consumeRes.consumedItem);
      currentInventory = consumeRes.updatedCharacter.inventory;
      currentHp = consumeRes.updatedCharacter.hp;
      currentMana = consumeRes.updatedCharacter.mana;
      currentGold = consumeRes.updatedCharacter.gold;
      // Record consumption fact in world ledger
      worldLedgerService.addFact(currentWorldLedger, {
        type: 'ITEM_CONSUMED',
        target: consumeRes.consumedItem.id,
        description: `Menggunakan ${consumeRes.consumedItem.name}`,
        turn: session?.turnCount || 1
      });
    }
  }

  // 2. Process Item Acquisition
  // Only accept items defined in itemMaster catalog
  const itemToReceive = updates.receivedItemId || updates.receivedItem;
  if (itemToReceive) {
    const itemDef = itemMaster.getItem(itemToReceive);
    if (itemDef) {
      const addRes = itemMaster.addItem({ inventory: currentInventory }, itemDef);
      if (addRes.success) {
        addedItems.push(itemDef);
        currentInventory = addRes.updatedCharacter.inventory;
        // Record acquisition fact in world ledger
        worldLedgerService.addFact(currentWorldLedger, {
          type: 'ITEM_ACQUIRED',
          target: itemDef.id,
          description: `Memperoleh item: ${itemDef.name}`,
          turn: session?.turnCount || 1
        });
      }
    }
  }

  // 3. Deterministic Stat Clamping (HP, Mana, Gold)
  const rawHpDelta = Number(updates.hpChange ?? 0);
  const rawManaDelta = Number(updates.manaChange ?? 0);
  const rawGoldDelta = Number(updates.goldChange ?? 0);

  // Clamp HP: never exceeds maxHp, never drops below 0
  const targetHp = currentHp + rawHpDelta;
  const clampedHp = Math.min(maxHp, Math.max(0, targetHp));
  const finalHpChange = clampedHp - currentHp;

  // Clamp Mana: never exceeds maxMana, never drops below 0
  const targetMana = currentMana + rawManaDelta;
  const clampedMana = Math.min(maxMana, Math.max(0, targetMana));
  const finalManaChange = clampedMana - currentMana;

  // Clamp Gold: never negative
  const targetGold = currentGold + rawGoldDelta;
  const clampedGold = Math.max(0, targetGold);
  const finalGoldChange = clampedGold - currentGold;

  // 4. Reputation updates
  const reputationChanges = updates.reputationChange || {};
  if (typeof reputationChanges === 'object') {
    for (const [faction, delta] of Object.entries(reputationChanges)) {
      if (faction && delta) {
        worldLedgerService.updateReputation(currentWorldLedger, faction, Number(delta));
      }
    }
  }

  // 5. Fact discovery
  const factText = updates.factDiscovered || null;
  if (factText) {
    worldLedgerService.addFact(currentWorldLedger, factText, (session?.turnCount || 1) + 1);
  }

  // 6. Quest & Objective Evaluation
  const missionEval = questEngine.evaluateObjectives(
    session,
    session?.Campaign || session?.campaignId,
    currentWorldLedger,
    {
      actionText: actionIntent.text || '',
      choiceId: actionIntent.choiceId || '',
      aiUpdates: updates,
      currentNode
    }
  );

  // 7. Determine Game Over Conditions
  const updatedCharState = {
    ...character,
    hp: clampedHp,
    maxHp,
    mana: clampedMana,
    maxMana,
    gold: clampedGold,
    inventory: currentInventory
  };

  const gameOverStatus = questEngine.isGameOverCondition(
    updatedCharState,
    session,
    missionEval
  );

  const updatedSessionState = {
    ...session,
    worldLedger: currentWorldLedger,
    missionLog: missionEval.missionLog,
    isGameOver: gameOverStatus.isGameOver
  };

  return {
    validatedUpdates: {
      hpChange: finalHpChange,
      manaChange: finalManaChange,
      goldChange: finalGoldChange,
      addedItems,
      removedItems,
      reputationChange: reputationChanges,
      factDiscovered: factText || null
    },
    updatedCharacterState: updatedCharState,
    updatedSessionState,
    isGameOver: gameOverStatus.isGameOver,
    gameOverReason: gameOverStatus.gameOverReason
  };
}

/**
 * Creates a comprehensive snapshot of game state to store in official StorySnapshot.
 *
 * @param {object} character - Character instance or state
 * @param {object} session - GameSession instance or state
 * @param {object} currentNode - Current StoryNode
 * @returns {object} Complete snapshot object
 */
function createSnapshot(character, session, currentNode = null) {
  if (!character || !session) return null;

  const charHp = Number(character.hp ?? 30);
  const charMaxHp = Number(character.maxHp ?? 30);
  const charMana = Number(character.mana ?? 20);
  const charMaxMana = Number(character.maxMana ?? 20);
  const charGold = Number(character.gold ?? 0);
  const charLevel = Number(character.level ?? 1);

  const inventory = Array.isArray(character.inventory)
    ? character.inventory.map(item => {
        if (!item) return null;
        if (typeof item === 'string') return { itemId: item, quantity: 1 };
        return {
          itemId: item.itemId || item.id,
          quantity: Number(item.quantity ?? 1)
        };
      }).filter(Boolean)
    : [];

  const normLedger = worldLedgerService.normalizeLedger(session.worldLedger);

  return {
    // Flat attributes for legacy compatibility
    hp: charHp,
    maxHp: charMaxHp,
    mana: charMana,
    maxMana: charMaxMana,
    gold: charGold,
    level: charLevel,
    inventory,
    equippedItems: Array.isArray(character.equippedItems) ? JSON.parse(JSON.stringify(character.equippedItems)) : [],
    statusEffects: Array.isArray(character.statusEffects) ? JSON.parse(JSON.stringify(character.statusEffects)) : [],
    worldLedger: JSON.parse(JSON.stringify(normLedger)),
    missionLog: session.missionLog ? JSON.parse(JSON.stringify(session.missionLog)) : null,
    questState: session.questState ? JSON.parse(JSON.stringify(session.questState)) : (session.missionLog || {}),
    combatState: session.combatState ? JSON.parse(JSON.stringify(session.combatState)) : null,
    turnCount: Number(session.turnCount ?? 1),
    isGameOver: Boolean(session.isGameOver ?? false),
    branchId: currentNode?.branchId || session.activeBranchId || 'main',
    nodeId: currentNode?.id || null,
    createdAt: new Date().toISOString(),

    // Structured fields for official StorySnapshot model
    characterState: {
      hp: charHp,
      maxHp: charMaxHp,
      mana: charMana,
      maxMana: charMaxMana,
      gold: charGold,
      level: charLevel,
      equippedItems: Array.isArray(character.equippedItems) ? character.equippedItems : [],
      statusEffects: Array.isArray(character.statusEffects) ? character.statusEffects : []
    },
    inventoryState: inventory,
    worldState: {
      flags: normLedger.flags || {},
      reputation: normLedger.reputation || {}
    },
    ledgerState: normLedger
  };
}

/**
 * Atomically restores character and session state from official StorySnapshot.
 *
 * @param {object} targetNode - Target StoryNode to rewind to
 * @param {object} session - Active GameSession
 * @param {object} character - Active Character
 * @param {object} transaction - Sequelize transaction object (optional)
 * @returns {Promise<object>} { success, character, session, restoredFromSnapshot }
 */
async function restoreSnapshot(targetNode, session, character, transaction = null) {
  if (!targetNode || !session || !character) {
    throw new Error('Data targetNode, session, dan character harus disertakan.');
  }

  // Security check: Verify target node belongs to active session
  if (targetNode.sessionId && session.id && targetNode.sessionId !== session.id) {
    throw new Error('Node target bukan milik sesi aktif.');
  }

  // Retrieve official StorySnapshot first
  let snap = null;
  if (targetNode.snapshot) {
    const s = targetNode.snapshot;
    snap = {
      ...(s.characterState || {}),
      inventory: s.inventoryState || s.characterState?.inventory || [],
      missionLog: s.questState,
      questState: s.questState,
      worldLedger: s.ledgerState || s.worldState,
      turnCount: s.characterState?.turnCount || s.ledgerState?.turnCount || targetNode.turnNumber
    };
  } else if (targetNode.id) {
    try {
      const { StorySnapshot } = require('../models');
      const dbSnap = await StorySnapshot.findOne({
        where: { storyNodeId: targetNode.id },
        ...(transaction ? { transaction } : {})
      });
      if (dbSnap) {
        snap = {
          ...(dbSnap.characterState || {}),
          inventory: dbSnap.inventoryState || dbSnap.characterState?.inventory || [],
          missionLog: dbSnap.questState,
          questState: dbSnap.questState,
          worldLedger: dbSnap.ledgerState || dbSnap.worldState,
          turnCount: dbSnap.characterState?.turnCount || dbSnap.ledgerState?.turnCount || targetNode.turnNumber
        };
      }
    } catch (e) {}
  }

  // Fallback to embedded snapshot columns for legacy nodes or in-memory unit tests
  if (!snap) {
    snap = targetNode.gameStateSnapshot || targetNode.characterSnapshot;
  }

  if (!snap) {
    throw new Error('Node target tidak memiliki data snapshot untuk dipulihkan.');
  }

  // 1. Restore Character State exactly from snapshot
  character.hp = snap.hp !== undefined ? snap.hp : (snap.characterState?.hp !== undefined ? snap.characterState.hp : character.hp);
  character.maxHp = snap.maxHp !== undefined ? snap.maxHp : (snap.characterState?.maxHp !== undefined ? snap.characterState.maxHp : character.maxHp);
  character.mana = snap.mana !== undefined ? snap.mana : (snap.characterState?.mana !== undefined ? snap.characterState.mana : character.mana);
  character.maxMana = snap.maxMana !== undefined ? snap.maxMana : (snap.characterState?.maxMana !== undefined ? snap.characterState.maxMana : character.maxMana);
  character.gold = snap.gold !== undefined ? snap.gold : (snap.characterState?.gold !== undefined ? snap.characterState.gold : character.gold);
  character.level = snap.level !== undefined ? snap.level : (snap.characterState?.level !== undefined ? snap.characterState.level : character.level);

  const rawInv = snap.inventory || snap.inventoryState || character.inventory;
  character.inventory = Array.isArray(rawInv)
    ? JSON.parse(JSON.stringify(rawInv))
    : character.inventory;

  character.equippedItems = Array.isArray(snap.equippedItems)
    ? JSON.parse(JSON.stringify(snap.equippedItems))
    : (character.equippedItems || []);
  character.statusEffects = Array.isArray(snap.statusEffects)
    ? JSON.parse(JSON.stringify(snap.statusEffects))
    : (character.statusEffects || []);

  // 2. Restore Session State exactly from snapshot
  session.currentSceneId = targetNode.id;
  session.turnCount = snap.turnCount !== undefined ? snap.turnCount : (targetNode.turnNumber || session.turnCount || 1);
  session.activeBranchId = targetNode.branchId || session.activeBranchId || 'main';

  const rawLedger = snap.worldLedger || snap.ledgerState || snap.worldState;
  session.worldLedger = rawLedger
    ? JSON.parse(JSON.stringify(worldLedgerService.normalizeLedger(rawLedger)))
    : worldLedgerService.normalizeLedger(session.worldLedger);

  session.missionLog = snap.missionLog
    ? JSON.parse(JSON.stringify(snap.missionLog))
    : session.missionLog;

  session.questState = snap.questState
    ? JSON.parse(JSON.stringify(snap.questState))
    : (session.missionLog || session.questState || {});

  session.combatState = snap.combatState !== undefined
    ? (snap.combatState ? JSON.parse(JSON.stringify(snap.combatState)) : null)
    : null;

  session.isGameOver = snap.isGameOver !== undefined
    ? snap.isGameOver
    : (character.hp <= 0);

  // Save changes atomically if instance methods are present
  const saveOptions = transaction ? { transaction } : {};
  if (typeof character.save === 'function') {
    await character.save(saveOptions);
  }
  if (typeof session.save === 'function') {
    await session.save(saveOptions);
  }

  return {
    success: true,
    character,
    session,
    targetNode
  };
}

module.exports = {
  resolveAction,
  createSnapshot,
  restoreSnapshot
};
