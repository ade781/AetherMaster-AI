/**
 * Quest & Objective Engine
 * Deterministic Quest State, Objectives Progression, and State-Based Endings.
 * Single Source of Truth: Database Quest & QuestObjective definitions.
 * Eliminates artificial turnCount endings (turnCount >= 11/12).
 */

const { getFlag } = require('./worldLedgerService');
const { EVENT_TYPES, createGameEvent, processGameEvents } = require('./gameEvents');
const { questsData } = require('../models/seeders/worldDataSeeder');

/**
 * Retrieves master quest definitions for a given campaign from database / canonical seeders.
 * Replaces legacy CAMPAIGN_OBJECTIVES.
 *
 * @param {string|object} campaign
 * @returns {Array<object>} Objectives for the campaign's main quest
 */
function getCampaignObjectives(campaign) {
  const campaignId = typeof campaign === 'object' ? campaign?.id : campaign;
  const quest = questsData.find(q => q.campaignId === campaignId && q.type === 'main') || questsData.find(q => q.campaignId === campaignId);

  if (quest && Array.isArray(quest.objectives)) {
    return JSON.parse(JSON.stringify(quest.objectives)).map(obj => ({
      id: obj.id,
      description: obj.description,
      required: !obj.isOptional,
      objectiveType: obj.objectiveType,
      targetId: obj.targetId,
      requiredCount: obj.requiredCount || 1,
      isFinale: obj.sequence === quest.objectives.length
    }));
  }

  // Graceful fallback for dynamic custom campaigns
  const title = typeof campaign === 'object' ? (campaign?.title || 'Petualangan') : 'Misi Utama';
  return [
    {
      id: 'obj_stage_1_investigate',
      description: `Selidiki petunjuk awal mengenai ${title}`,
      required: true,
      objectiveType: 'INVESTIGATE',
      requiredCount: 1
    },
    {
      id: 'obj_stage_2_advance',
      description: 'Atasi rintangan inti dan temukan sumber konflik utama',
      required: true,
      objectiveType: 'EXPLORE',
      requiredCount: 1
    },
    {
      id: 'obj_stage_3_climax',
      description: `Tuntaskan konfrontasi akhir dan selesaikan misi ${title}`,
      required: true,
      isFinale: true,
      objectiveType: 'DEFEAT',
      requiredCount: 1
    }
  ];
}

/**
 * Initializes a new missionLog and runtime questState for a game session.
 *
 * @param {object} campaign
 * @returns {object}
 */
function initializeMissionLog(campaign) {
  const campaignId = typeof campaign === 'object' ? campaign?.id : campaign;
  const quest = questsData.find(q => q.campaignId === campaignId && q.type === 'main') || questsData[0];
  const objectives = getCampaignObjectives(campaign);
  const activeObj = objectives[0];

  const objStateMap = {};
  for (const obj of objectives) {
    objStateMap[obj.id] = {
      currentCount: 0,
      requiredCount: obj.requiredCount || 1,
      completed: false,
      completedAtTurn: null
    };
  }

  return {
    questId: quest?.id || 'quest_main',
    title: quest?.title || campaign?.title || 'Misi Petualangan',
    objective: activeObj ? activeObj.description : 'Jelajahi dunia dan selesaikan tantangan',
    status: 'active', // 'active' | 'completed' | 'failed'
    currentObjectiveIndex: 0,
    mainQuestCompleted: false,
    objectives: objectives.map((obj) => ({
      ...obj,
      completed: false,
      completedAtTurn: null
    })),
    questState: {
      activeQuestId: quest?.id || 'quest_main',
      objectives: objStateMap,
      completedQuestIds: [],
      isMainQuestCompleted: false
    }
  };
}

/**
 * Evaluates quest and objective progression deterministically based on Game Events.
 * Strictly prevents AI narrative output from directly forcing quest completion.
 * Prevents finish_game from bypassing incomplete objectives.
 *
 * @param {object} session - GameSession instance or plain session data
 * @param {object} campaign - Campaign data
 * @param {object} worldLedger - Structured world ledger
 * @param {object} actionContext - { actionText, choiceId, aiUpdates, currentNode, actionIntent }
 * @returns {object} { missionLog, mainQuestCompleted, canTriggerEnding, endingReason, objectiveAdvanced }
 */
function evaluateObjectives(session, campaign, worldLedger, actionContext = {}) {
  let missionLog = session?.missionLog;

  // Initialize mission log if missing
  if (!missionLog || !Array.isArray(missionLog.objectives) || missionLog.objectives.length === 0) {
    missionLog = initializeMissionLog(campaign);
  } else {
    missionLog = JSON.parse(JSON.stringify(missionLog));
  }

  let objectiveAdvanced = false;
  const currentIdx = missionLog.currentObjectiveIndex || 0;
  const currentObj = missionLog.objectives[currentIdx];
  const turn = Number(session?.turnCount ?? 1);

  // 1. Synthesize verified Game Events from action context
  const synthesizedEvents = [];
  const choiceId = actionContext.choiceId || '';
  const actionText = String(actionContext.actionText || '').toLowerCase();
  const currentNode = actionContext.currentNode;
  const updates = actionContext.aiUpdates || {};

  if (choiceId || actionText) {
    synthesizedEvents.push(createGameEvent(EVENT_TYPES.ACTION_COMMITTED, {
      turn,
      description: actionText,
      data: { choiceId }
    }));
  }

  // Location event
  const locationTarget = currentNode?.locationId || currentNode?.location;
  if (locationTarget) {
    synthesizedEvents.push(createGameEvent(EVENT_TYPES.LOCATION_ENTERED, {
      targetId: locationTarget,
      turn
    }));
  }

  // Speaker / NPC interaction event
  const speakerTarget = currentNode?.speakerId || currentNode?.speaker;
  if (speakerTarget) {
    synthesizedEvents.push(createGameEvent(EVENT_TYPES.NPC_INTERACTED, {
      targetId: speakerTarget,
      turn
    }));
  }

  // Item events
  if (updates.receivedItemId) {
    synthesizedEvents.push(createGameEvent(EVENT_TYPES.ITEM_ACQUIRED, {
      targetId: updates.receivedItemId,
      turn
    }));
  }
  if (updates.consumedItemId) {
    synthesizedEvents.push(createGameEvent(EVENT_TYPES.ITEM_USED, {
      targetId: updates.consumedItemId,
      turn
    }));
  }

  // Fact discovery event
  if (updates.factDiscovered) {
    synthesizedEvents.push(createGameEvent(EVENT_TYPES.CLUE_DISCOVERED, {
      description: updates.factDiscovered,
      turn
    }));
  }

  // Combat victory event
  if (session?.combatState?.isVictory || actionContext.isVictory) {
    synthesizedEvents.push(createGameEvent(EVENT_TYPES.THREAT_RESOLVED, {
      targetId: session?.combatState?.enemy?.id || locationTarget,
      turn
    }));
  }

  // 2. Process synthesized Game Events against active campaign quests
  const campaignId = typeof campaign === 'object' ? campaign?.id : campaign;
  const campaignQuests = questsData.filter(q => !campaignId || q.campaignId === campaignId);

  const eventResult = processGameEvents(
    synthesizedEvents,
    missionLog.questState || {},
    campaignQuests
  );

  // Sync event completions back into missionLog.objectives
  for (const comp of eventResult.completedObjectives) {
    const matched = missionLog.objectives.find(o => o.id === comp.objectiveId);
    if (matched && !matched.completed) {
      matched.completed = true;
      matched.completedAtTurn = turn;
      objectiveAdvanced = true;
    }
  }

  // 3. Fallback check: World Ledger flags (for compatibility with legacy scripted tests/events)
  if (currentObj && !currentObj.completed) {
    const objId = currentObj.id;
    if (getFlag(worldLedger, `${objId}_completed`) || getFlag(worldLedger, `${objId}_done`)) {
      currentObj.completed = true;
      currentObj.completedAtTurn = turn;
      objectiveAdvanced = true;
    }
  }

  // 4. Update objective indexing and completion state
  const nextIdx = missionLog.objectives.findIndex(o => !o.completed);
  if (nextIdx === -1) {
    missionLog.currentObjectiveIndex = missionLog.objectives.length - 1;
    missionLog.mainQuestCompleted = true;
    missionLog.status = 'completed';
    missionLog.objective = 'Seluruh objektif utama petualangan berhasil dituntaskan!';
  } else {
    missionLog.currentObjectiveIndex = nextIdx;
    missionLog.mainQuestCompleted = false;
    missionLog.status = 'active';
    missionLog.objective = missionLog.objectives[nextIdx].description;
  }

  // 5. Ending Validation:
  // finish_game cannot trigger unless all required objectives are completed!
  const allRequiredDone = missionLog.objectives
    .filter(o => o.required)
    .every(o => o.completed);

  const canTriggerEnding = allRequiredDone || missionLog.mainQuestCompleted === true;
  const endingReason = canTriggerEnding ? 'VICTORY' : null;

  return {
    missionLog,
    mainQuestCompleted: canTriggerEnding,
    canTriggerEnding,
    endingReason,
    objectiveAdvanced
  };
}

/**
 * Checks overall game over status deterministically.
 * Game over occurs if character HP drops to 0 (Defeat) or all main objectives are fulfilled (Victory).
 *
 * @param {object} character
 * @param {object} session
 * @param {object} missionEvaluation
 * @returns {object} { isGameOver, gameOverReason }
 */
function isGameOverCondition(character, session, missionEvaluation) {
  const hp = Number(character?.hp ?? 30);
  if (hp <= 0) {
    return {
      isGameOver: true,
      gameOverReason: 'DEFEAT'
    };
  }

  // Victory occurs ONLY if all required objectives were completed!
  if (missionEvaluation?.mainQuestCompleted === true && missionEvaluation?.canTriggerEnding === true) {
    return {
      isGameOver: true,
      gameOverReason: 'VICTORY'
    };
  }

  return {
    isGameOver: false,
    gameOverReason: null
  };
}

/**
 * Manually marks a specific objective as completed.
 *
 * @param {object} missionLog
 * @param {string} objectiveId
 * @param {number} turn
 * @returns {object} Updated missionLog
 */
function completeObjective(missionLog, objectiveId, turn = 1) {
  if (!missionLog || !Array.isArray(missionLog.objectives)) return missionLog;
  const copy = JSON.parse(JSON.stringify(missionLog));
  const target = copy.objectives.find(o => o.id === objectiveId);
  if (target) {
    target.completed = true;
    target.completedAtTurn = turn;
  }

  const nextIdx = copy.objectives.findIndex(o => !o.completed);
  if (nextIdx === -1) {
    copy.mainQuestCompleted = true;
    copy.status = 'completed';
    copy.objective = 'Seluruh misi petualangan berhasil diselesaikan!';
  } else {
    copy.currentObjectiveIndex = nextIdx;
    copy.objective = copy.objectives[nextIdx].description;
  }

  return copy;
}

module.exports = {
  getCampaignObjectives,
  initializeMissionLog,
  evaluateObjectives,
  isGameOverCondition,
  completeObjective
};
