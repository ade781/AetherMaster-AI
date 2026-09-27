/**
 * Game Event Pipeline
 * Deterministic event dispatching and processing for all state and quest mutations.
 * Binds player actions, environment transitions, item operations, and combat to quest progression.
 */

const EVENT_TYPES = {
  ACTION_COMMITTED: 'ACTION_COMMITTED',
  NPC_INTERACTED: 'NPC_INTERACTED',
  LOCATION_ENTERED: 'LOCATION_ENTERED',
  ITEM_USED: 'ITEM_USED',
  ITEM_ACQUIRED: 'ITEM_ACQUIRED',
  THREAT_RESOLVED: 'THREAT_RESOLVED',
  CLUE_DISCOVERED: 'CLUE_DISCOVERED',
  OBJECTIVE_COMPLETED: 'OBJECTIVE_COMPLETED',
  QUEST_COMPLETED: 'QUEST_COMPLETED'
};

/**
 * Creates a standardized Game Event payload.
 *
 * @param {string} type - Member of EVENT_TYPES
 * @param {object} payload - { targetId, actorId, data, turn, description }
 * @returns {object} Standardized event object
 */
function createGameEvent(type, payload = {}) {
  return {
    type,
    targetId: payload.targetId || null,
    actorId: payload.actorId || null,
    data: payload.data || {},
    turn: payload.turn || 1,
    description: payload.description || '',
    timestamp: new Date().toISOString()
  };
}

/**
 * Processes game events against active quests and objectives deterministically.
 *
 * @param {Array<object>} events - List of Game Events
 * @param {object} questState - Session's runtime quest state
 * @param {Array<object>} masterQuests - Canonical quests with objectives from database
 * @returns {object} { updatedQuestState, completedObjectives, completedQuests, eventsProcessed }
 */
function processGameEvents(events, questState = {}, masterQuests = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      updatedQuestState: questState,
      completedObjectives: [],
      completedQuests: [],
      eventsProcessed: 0
    };
  }

  const state = JSON.parse(JSON.stringify(questState || {}));
  state.objectives = state.objectives || {};
  state.completedQuestIds = state.completedQuestIds || [];

  const completedObjectives = [];
  const completedQuests = [];

  for (const event of events) {
    if (!event || !event.type) continue;

    // Check each active objective in master quests
    for (const q of masterQuests) {
      if (state.completedQuestIds.includes(q.id)) continue;
      if (!Array.isArray(q.objectives)) continue;

      let allQuestRequiredDone = true;

      for (const obj of q.objectives) {
        const objState = state.objectives[obj.id] || {
          currentCount: 0,
          requiredCount: obj.requiredCount || 1,
          completed: false
        };

        if (objState.completed) {
          state.objectives[obj.id] = objState;
          continue;
        }

        // Match objective criteria with event
        let isMatch = false;

        const objType = String(obj.objectiveType || '').toUpperCase();
        const objTarget = String(obj.targetId || '').toLowerCase();
        const evtTarget = String(event.targetId || '').toLowerCase();

        switch (event.type) {
          case EVENT_TYPES.NPC_INTERACTED:
            if ((objType === 'TALK' || objType === 'INVESTIGATE') && (!objTarget || evtTarget.includes(objTarget) || objTarget.includes(evtTarget))) {
              isMatch = true;
            }
            break;

          case EVENT_TYPES.LOCATION_ENTERED:
            if ((objType === 'EXPLORE' || objType === 'NAVIGATE') && (!objTarget || evtTarget.includes(objTarget) || objTarget.includes(evtTarget))) {
              isMatch = true;
            }
            break;

          case EVENT_TYPES.ITEM_USED:
            if ((objType === 'USE_ITEM' || objType === 'ITEM') && (!objTarget || evtTarget.includes(objTarget) || objTarget.includes(evtTarget))) {
              isMatch = true;
            }
            break;

          case EVENT_TYPES.ITEM_ACQUIRED:
            if ((objType === 'ACQUIRE' || objType === 'FETCH') && (!objTarget || evtTarget.includes(objTarget) || objTarget.includes(evtTarget))) {
              isMatch = true;
            }
            break;

          case EVENT_TYPES.THREAT_RESOLVED:
            if ((objType === 'DEFEAT' || objType === 'COMBAT') && (!objTarget || evtTarget.includes(objTarget) || objTarget.includes(evtTarget))) {
              isMatch = true;
            }
            break;

          case EVENT_TYPES.CLUE_DISCOVERED:
            if (objType === 'INVESTIGATE') {
              isMatch = true;
            }
            break;

          default:
            break;
        }

        if (isMatch) {
          objState.currentCount = Math.min(objState.requiredCount, objState.currentCount + 1);
          if (objState.currentCount >= objState.requiredCount) {
            objState.completed = true;
            objState.completedAtTurn = event.turn;
            completedObjectives.push({
              objectiveId: obj.id,
              questId: q.id,
              description: obj.description
            });
          }
        }

        state.objectives[obj.id] = objState;

        if (!obj.isOptional && !objState.completed) {
          allQuestRequiredDone = false;
        }
      }

      if (allQuestRequiredDone && !state.completedQuestIds.includes(q.id)) {
        state.completedQuestIds.push(q.id);
        completedQuests.push(q.id);
        if (q.type === 'main') {
          state.isMainQuestCompleted = true;
        }
      }
    }
  }

  return {
    updatedQuestState: state,
    completedObjectives,
    completedQuests,
    eventsProcessed: events.length
  };
}

module.exports = {
  EVENT_TYPES,
  createGameEvent,
  processGameEvents
};
