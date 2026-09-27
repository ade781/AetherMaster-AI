/**
 * Quest & Objective Engine
 * Deterministic Quest State, Objectives Progression, and State-Based Endings.
 * Eliminates artificial turnCount endings (turnCount >= 11/12).
 */

const { getFlag, hasFact } = require('./worldLedgerService');

/**
 * Master Objectives Catalog for Campaigns.
 * Each campaign has a multi-phase quest line with required objectives.
 */
const CAMPAIGN_OBJECTIVES = {
  whispering_tavern: [
    {
      id: 'obj_tavern_investigate',
      description: 'Selidiki sumber ketukan misterius di ruang bawah tanah kedai',
      required: true,
      hint: 'Bicaralah dengan Eldrin atau periksa tumpukan tong anggur'
    },
    {
      id: 'obj_tavern_find_catacomb',
      description: 'Temukan jalan masuk rahasia menuju katakombe kuno di balik dinding',
      required: true,
      hint: 'Gunakan kunci tengkorak atau pecahkan teka-teki tuas tong'
    },
    {
      id: 'obj_tavern_resolve_threat',
      description: 'Netralkan sumber ancaman katakombe dan amankan kedai Whispering Tavern',
      required: true,
      isFinale: true,
      hint: 'Hadapi entitas penjaga katakombe atau segel retakan kuno'
    }
  ],
  crypt_of_crimson: [
    {
      id: 'obj_crypt_enter',
      description: 'Masuk melewati barikade gerbang Makam Merah Darah',
      required: true
    },
    {
      id: 'obj_crypt_stop_patrol',
      description: 'Hentikan patroli kerangka dan temukan ruang altar utama',
      required: true
    },
    {
      id: 'obj_crypt_disrupt_ritual',
      description: 'Gagalkan ritual Kultus Kematian Merah dan segel peti sarkofagus',
      required: true,
      isFinale: true
    }
  ],
  abyssal_citadel: [
    {
      id: 'obj_citadel_infiltrate',
      description: 'Masuk ke dalam kubah udara Reruntuhan Samudra Sunken Citadel',
      required: true
    },
    {
      id: 'obj_citadel_disable_beacon',
      description: 'Nonaktifkan anomali pemancar energi psionik di aula pualam',
      required: true
    },
    {
      id: 'obj_citadel_gate_seal',
      description: 'Kunci gerbang palung purba dari pemuja kedalaman',
      required: true,
      isFinale: true
    }
  ],
  vampire_castle_shadows: [
    {
      id: 'obj_castle_breach',
      description: 'Tembus gerbang luar Kastil Bloodmere menuju aula utama',
      required: true
    },
    {
      id: 'obj_castle_rescue',
      description: 'Temukan dan bebaskan pemuda desa yang ditawan di ruang bawah',
      required: true
    },
    {
      id: 'obj_castle_confront_lord',
      description: 'Konfrontasi Lord Cassian dan akhiri cengkeraman teror Kastil Bloodmere',
      required: true,
      isFinale: true
    }
  ]
};

/**
 * Retrieves default objectives for a given campaign.
 * If campaign is not found in master catalog, generates a robust 3-stage objective chain.
 *
 * @param {string|object} campaign
 * @returns {Array<object>}
 */
function getCampaignObjectives(campaign) {
  const campaignId = typeof campaign === 'object' ? campaign?.id : campaign;
  if (campaignId && CAMPAIGN_OBJECTIVES[campaignId]) {
    return JSON.parse(JSON.stringify(CAMPAIGN_OBJECTIVES[campaignId]));
  }

  const title = typeof campaign === 'object' ? (campaign?.title || 'Petualangan') : 'Misi Utama';

  return [
    {
      id: 'obj_stage_1_investigate',
      description: `Selidiki petunjuk awal mengenai ${title}`,
      required: true
    },
    {
      id: 'obj_stage_2_advance',
      description: 'Atasi rintangan inti dan temukan sumber konflik utama',
      required: true
    },
    {
      id: 'obj_stage_3_climax',
      description: `Tuntaskan konfrontasi akhir dan selesaikan misi ${title}`,
      required: true,
      isFinale: true
    }
  ];
}

/**
 * Initializes a new missionLog for a game session.
 *
 * @param {object} campaign
 * @returns {object}
 */
function initializeMissionLog(campaign) {
  const objectives = getCampaignObjectives(campaign);
  const activeObj = objectives[0];

  return {
    title: campaign?.title || 'Misi Petualangan',
    objective: activeObj ? activeObj.description : 'Jelajahi dunia dan selesaikan tantangan',
    status: 'active', // 'active' | 'completed' | 'failed'
    currentObjectiveIndex: 0,
    mainQuestCompleted: false,
    objectives: objectives.map((obj, idx) => ({
      ...obj,
      completed: false,
      completedAtTurn: null
    }))
  };
}

/**
 * Evaluates quest and objective progression based on world facts, flags, and actions.
 *
 * @param {object} session - GameSession instance or plain session data
 * @param {object} campaign - Campaign data
 * @param {object} worldLedger - Structured world ledger
 * @param {object} actionContext - { actionText, choiceId, aiUpdates, currentNode }
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

  // Check if AI explicitly marked mission completed or provided a new mission objective
  const aiMission = actionContext.aiUpdates?.missionLog;
  if (aiMission && typeof aiMission === 'object') {
    if (aiMission.status === 'completed' && currentObj) {
      currentObj.completed = true;
      currentObj.completedAtTurn = session.turnCount || 1;
      objectiveAdvanced = true;
    }
  }

  // Check choice or action intent for explicit ending/progression
  const choiceId = actionContext.choiceId || '';
  if (choiceId === 'finish_game' || choiceId === 'choice_ending_complete') {
    if (currentObj) {
      currentObj.completed = true;
      currentObj.completedAtTurn = session.turnCount || 1;
    }
  }

  // Check world ledger flags for objective fulfillment
  if (currentObj && !currentObj.completed) {
    const objId = currentObj.id;
    if (getFlag(worldLedger, `${objId}_completed`) || getFlag(worldLedger, `${objId}_done`)) {
      currentObj.completed = true;
      currentObj.completedAtTurn = session.turnCount || 1;
      objectiveAdvanced = true;
    }
  }

  // Advance to next uncompleted objective
  let nextIdx = missionLog.objectives.findIndex(o => !o.completed);
  if (nextIdx === -1) {
    // All objectives completed!
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

  // Check if victory condition is satisfied
  // Rule: Turn count ALONE does not grant victory!
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

  if (missionEvaluation?.mainQuestCompleted === true) {
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
  CAMPAIGN_OBJECTIVES,
  getCampaignObjectives,
  initializeMissionLog,
  evaluateObjectives,
  isGameOverCondition,
  completeObjective
};
