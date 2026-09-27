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
  const currentHp = Number(character?.hp ?? 30);
  const maxHp = Number(character?.maxHp ?? 30);
  const currentMana = Number(character?.mana ?? 20);
  const maxMana = Number(character?.maxMana ?? 20);
  const currentGold = Number(character?.gold ?? 0);
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
  // AI may propose changes: proposedHpChange / hpChange
  const rawHpDelta = Number(updates.proposedHpChange ?? updates.hpChange ?? 0);
  const rawManaDelta = Number(updates.proposedManaChange ?? updates.manaChange ?? 0);
  const rawGoldDelta = Number(updates.proposedGoldChange ?? updates.goldChange ?? 0);

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
  const reputationChanges = updates.reputationChange || updates.reputation || {};
  if (typeof reputationChanges === 'object') {
    for (const [faction, delta] of Object.entries(reputationChanges)) {
      if (faction && delta) {
        worldLedgerService.updateReputation(currentWorldLedger, faction, Number(delta));
      }
    }
  }

  // 5. Fact discovery
  const factText = updates.factDiscovered || updates.addLedgerFact;
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
 * Creates a comprehensive snapshot of game state to store in StoryNode.
 *
 * @param {object} character - Character instance or state
 * @param {object} session - GameSession instance or state
 * @param {object} currentNode - Current StoryNode
 * @returns {object} Complete snapshot
 */
function createSnapshot(character, session, currentNode = null) {
  if (!character || !session) return null;

  return {
    hp: Number(character.hp ?? 30),
    maxHp: Number(character.maxHp ?? 30),
    mana: Number(character.mana ?? 20),
    maxMana: Number(character.maxMana ?? 20),
    gold: Number(character.gold ?? 0),
    level: Number(character.level ?? 1),
    inventory: Array.isArray(character.inventory)
      ? JSON.parse(JSON.stringify(character.inventory))
      : [],
    equippedItems: Array.isArray(character.equippedItems)
      ? JSON.parse(JSON.stringify(character.equippedItems))
      : [],
    statusEffects: Array.isArray(character.statusEffects)
      ? JSON.parse(JSON.stringify(character.statusEffects))
      : [],
    worldLedger: JSON.parse(JSON.stringify(worldLedgerService.normalizeLedger(session.worldLedger))),
    missionLog: session.missionLog
      ? JSON.parse(JSON.stringify(session.missionLog))
      : null,
    combatState: session.combatState
      ? JSON.parse(JSON.stringify(session.combatState))
      : null,
    turnCount: Number(session.turnCount ?? 1),
    isGameOver: Boolean(session.isGameOver ?? false),
    nodeId: currentNode?.id || null,
    createdAt: new Date().toISOString()
  };
}

/**
 * Atomically restores character and session state from a StoryNode snapshot.
 *
 * IMPORTANT RULES:
 * - Rejects if targetNode does not belong to the session.
 * - Restores HP exactly as recorded in snapshot; NEVER blindly restores to 50%.
 * - Restores inventory, worldLedger, missionLog, combatState, and isGameOver.
 * - Supports database transaction when passed.
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
  if (targetNode.sessionId !== session.id) {
    throw new Error('Node target bukan milik sesi aktif.');
  }

  // Retrieve snapshot (prefer gameStateSnapshot, fallback to characterSnapshot for legacy nodes)
  const snap = targetNode.gameStateSnapshot || targetNode.characterSnapshot;
  if (!snap) {
    throw new Error('Node target tidak memiliki data snapshot untuk dipulihkan.');
  }

  // 1. Restore Character State exactly from snapshot
  character.hp = snap.hp !== undefined ? snap.hp : character.hp;
  character.maxHp = snap.maxHp !== undefined ? snap.maxHp : character.maxHp;
  character.mana = snap.mana !== undefined ? snap.mana : character.mana;
  character.maxMana = snap.maxMana !== undefined ? snap.maxMana : character.maxMana;
  character.gold = snap.gold !== undefined ? snap.gold : character.gold;
  character.level = snap.level !== undefined ? snap.level : character.level;
  character.inventory = Array.isArray(snap.inventory)
    ? JSON.parse(JSON.stringify(snap.inventory))
    : character.inventory;
  character.equippedItems = Array.isArray(snap.equippedItems)
    ? JSON.parse(JSON.stringify(snap.equippedItems))
    : (character.equippedItems || []);
  character.statusEffects = Array.isArray(snap.statusEffects)
    ? JSON.parse(JSON.stringify(snap.statusEffects))
    : (character.statusEffects || []);

  // 2. Restore Session State exactly from snapshot
  session.currentSceneId = targetNode.id;
  session.turnCount = snap.turnCount !== undefined ? snap.turnCount : (session.turnCount || 1);
  session.worldLedger = snap.worldLedger
    ? JSON.parse(JSON.stringify(worldLedgerService.normalizeLedger(snap.worldLedger)))
    : worldLedgerService.normalizeLedger(session.worldLedger);
  session.missionLog = snap.missionLog
    ? JSON.parse(JSON.stringify(snap.missionLog))
    : session.missionLog;
  session.combatState = snap.combatState !== undefined
    ? (snap.combatState ? JSON.parse(JSON.stringify(snap.combatState)) : null)
    : null;
  session.isGameOver = snap.isGameOver !== undefined
    ? snap.isGameOver
    : (character.hp <= 0);

  // Save changes atomically (with transaction if provided)
  const saveOptions = transaction ? { transaction } : {};
  await character.save(saveOptions);
  await session.save(saveOptions);

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
