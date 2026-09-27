/**
 * Canonical Game Context Builder
 * Single entry point for constructing rich, validated world context for Gemini narrative generation.
 * Integrates database models: Campaign, Location, NPC, Item, Quest, WorldFact, and active StoryNodes.
 */

const { GameSession, Character, Campaign } = require('../../models');
const {
  ItemRepository,
  NPCRepository,
  LocationRepository,
  QuestRepository,
  WorldFactRepository,
  StoryNodeRepository
} = require('../../repositories');

/**
 * Builds the canonical game context for a given session.
 *
 * @param {string} sessionId
 * @returns {Promise<object>} Complete validated game context
 */
async function buildGameContext(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required to build game context.');
  }

  // 1. Fetch GameSession with Character and Campaign
  const session = await GameSession.findByPk(sessionId, {
    include: [Character, Campaign]
  });

  if (!session) {
    throw new Error(`Sesi permainan "${sessionId}" tidak ditemukan.`);
  }

  const character = session.Character;
  const campaign = session.Campaign;
  const activeBranchId = session.activeBranchId || 'main';

  // 2. Fetch Current StoryNode
  let currentNode = null;
  if (session.currentSceneId) {
    currentNode = await StoryNodeRepository.findById(session.currentSceneId);
  }

  // 3. Hydrate character inventory with master Item database
  const hydratedInventory = character?.inventory
    ? await ItemRepository.hydrateInventory(character.inventory)
    : [];

  // 4. Fetch Location context
  const campaignId = campaign?.id || session.campaignId;
  const locationId = currentNode?.locationId || campaign?.defaultBackgroundId || 'loc_tavern_main';
  const currentLocation = await LocationRepository.findById(locationId);
  const availableLocations = await LocationRepository.findByCampaign(campaignId);

  // 5. Fetch NPCs stationed at location / campaign
  let nearbyNpcs = [];
  if (currentLocation?.id) {
    nearbyNpcs = await NPCRepository.findByLocation(currentLocation.id);
  }
  if (!nearbyNpcs || nearbyNpcs.length === 0) {
    nearbyNpcs = await NPCRepository.findByCampaign(campaignId);
  }

  // 6. Fetch Quests and Active Objectives
  const quests = await QuestRepository.findByCampaign(campaignId);
  const activeQuest = quests.find(q => q.type === 'main') || quests[0] || null;

  // 7. Fetch World Facts for the Active Branch only
  const activeWorldFacts = await WorldFactRepository.findActiveBranchFacts(sessionId, activeBranchId);

  // 8. Fetch Recent Story Nodes on Active Branch (limit to last 5)
  const activeTimeline = await StoryNodeRepository.findActiveTimeline(sessionId, activeBranchId);
  const recentNodes = activeTimeline.slice(-5);

  return {
    session: {
      id: session.id,
      turnCount: session.turnCount,
      activeBranchId,
      isGameOver: session.isGameOver,
      currentSceneId: session.currentSceneId,
      questState: session.questState || {},
      worldLedger: session.worldLedger || {}
    },
    character: {
      id: character?.id,
      name: character?.name || 'Petualang',
      race: character?.race || 'human',
      characterClass: character?.characterClass || 'warrior',
      level: character?.level || 1,
      hp: character?.hp ?? 30,
      maxHp: character?.maxHp ?? 30,
      mana: character?.mana ?? 20,
      maxMana: character?.maxMana ?? 20,
      gold: character?.gold ?? 0,
      inventory: hydratedInventory
    },
    campaign: {
      id: campaign?.id || campaignId,
      title: campaign?.title || 'Petualangan Aether',
      genre: campaign?.genre || 'dark_fantasy',
      premise: campaign?.premise || '',
      defaultBackgroundId: campaign?.defaultBackgroundId || 'bg_01_tavern'
    },
    currentNode: currentNode ? {
      id: currentNode.id,
      chapterTitle: currentNode.chapterTitle,
      location: currentNode.location,
      locationId: currentNode.locationId,
      backgroundId: currentNode.backgroundId,
      speaker: currentNode.speaker,
      speakerId: currentNode.speakerId,
      dialogueText: currentNode.dialogueText,
      mood: currentNode.mood,
      branchId: currentNode.branchId,
      status: currentNode.status,
      choices: currentNode.choiceList || currentNode.choices || []
    } : null,
    currentLocation: currentLocation ? {
      id: currentLocation.id,
      name: currentLocation.name,
      type: currentLocation.type,
      description: currentLocation.description,
      atmosphere: currentLocation.atmosphere,
      backgroundId: currentLocation.backgroundId
    } : null,
    availableLocations: availableLocations.map(l => ({
      id: l.id,
      name: l.name,
      backgroundId: l.backgroundId
    })),
    nearbyNpcs: nearbyNpcs.map(n => ({
      id: n.id,
      name: n.name,
      role: n.role,
      faction: n.faction,
      personality: n.personality
    })),
    activeQuest: activeQuest ? {
      id: activeQuest.id,
      title: activeQuest.title,
      description: activeQuest.description,
      objectives: activeQuest.objectives || []
    } : null,
    activeWorldFacts: activeWorldFacts.map(f => ({
      id: f.id,
      fact: f.fact,
      subjectType: f.subjectType,
      subjectId: f.subjectId,
      turn: f.turn
    })),
    recentHistory: recentNodes.map(n => ({
      id: n.id,
      turnCount: n.turnNumber,
      speaker: n.speaker,
      location: n.location,
      dialogueText: n.dialogueText
    }))
  };
}

module.exports = {
  buildGameContext
};
