const {
  Character,
  Campaign,
  GameSession,
  StoryNode,
  Location,
  NPC,
  Item,
  Quest,
  QuestObjective,
  WorldFact,
  StoryChoice,
  StorySnapshot
} = require('../models');
const { sequelize } = require('../config/database');
const geminiService = require('../services/geminiService');
const combatEngine = require('../engine/combatEngine');
const gameStateEngine = require('../engine/gameStateEngine');
const itemMaster = require('../engine/itemMaster');
const questEngine = require('../engine/questEngine');
const worldLedgerService = require('../engine/worldLedgerService');
const logger = require('../utils/logger');
const { getEffectiveStats } = require('../utils/statEngine');
const {
  ItemRepository,
  NPCRepository,
  LocationRepository,
  CampaignRepository,
  QuestRepository,
  WorldFactRepository,
  StoryNodeRepository,
  SnapshotRepository,
  StoryChoiceRepository
} = require('../repositories');

function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return Object.values(parsed);
    } catch (e) {}
  }
  if (val && typeof val === 'object') return Object.values(val);
  return [];
}

function safeObject(val) {
  if (val && typeof val === 'object' && !Array.isArray(val)) return { ...val };
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return {};
}

function resolveChoice(currentNode, choiceId, customText, tone) {
  const choiceList = safeArray(currentNode?.choices);
  const matched = choiceList.find(c => c && (c.id === choiceId || c.choiceKey === choiceId || c.text === choiceId));
  if (matched) return matched;

  const text = customText || (typeof choiceId === 'string' && choiceId !== 'custom' ? choiceId : 'Melangkah maju dengan waspada');

  return {
    id: choiceId || 'custom',
    choiceKey: choiceId || 'custom',
    text,
    tone: tone || 'kreatif'
  };
}

async function getRecentStoryHistory(sessionId, currentSceneId, limit = 4) {
  try {
    const nodes = await StoryNode.findAll({
      where: { sessionId, status: 'ACTIVE' },
      attributes: ['id', 'parentNodeId', 'chapterTitle', 'location', 'speaker', 'characterId', 'mood', 'dialogueText', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const chain = [];
    let curr = nodeMap.get(currentSceneId);
    while (curr && chain.length < limit) {
      chain.unshift(curr);
      curr = curr.parentNodeId ? nodeMap.get(curr.parentNodeId) : null;
    }
    return chain;
  } catch (err) {
    logger.warn('Error building story history chain', { error: err.message });
    return [];
  }
}

/**
 * Advance story state using centralized GameStateEngine and Game Event pipeline with atomic transaction.
 */
async function advanceStoryState({ session, character, currentNode, chosenChoice, nextScene, transaction }) {
  const stateUpdates = nextScene.stateUpdates || {};
  const activeBranchId = session.activeBranchId || 'main';

  // 1. Resolve State Mutators strictly via GameStateEngine
  const resolvedResult = gameStateEngine.resolveAction(
    session,
    character,
    currentNode,
    {
      choiceId: chosenChoice?.id || chosenChoice?.choiceKey,
      text: chosenChoice?.text,
      tone: chosenChoice?.tone
    },
    stateUpdates
  );

  const validatedUpdates = resolvedResult.validatedUpdates;
  const updatedCharState = resolvedResult.updatedCharacterState;
  const updatedSessionState = resolvedResult.updatedSessionState;

  // Apply clamped stats to character model
  character.hp = updatedCharState.hp;
  character.mana = updatedCharState.mana;
  character.gold = updatedCharState.gold;
  character.inventory = updatedCharState.inventory;
  await character.save({ transaction });

  // Update session attributes
  session.turnCount += 1;
  session.worldLedger = updatedSessionState.worldLedger;
  session.missionLog = updatedSessionState.missionLog;
  session.questState = updatedSessionState.missionLog?.questState || updatedSessionState.missionLog || session.questState;
  session.isGameOver = resolvedResult.isGameOver;

  // 2. Resolve background ID safely with campaign validation
  const campaignBg = session.Campaign?.defaultBackgroundId;
  const currentBg = currentNode?.backgroundId;
  const candidateBg = nextScene?.backgroundId;
  let resolvedBg = candidateBg;
  if (!resolvedBg || (resolvedBg === 'bg_01_tavern' && campaignBg && campaignBg !== 'bg_01_tavern')) {
    resolvedBg = currentBg || campaignBg || 'bg_01_tavern';
  }

  // 3. Resolve and strictly validate locationId and speakerId from database
  let locationId = null;
  let speakerId = null;
  try {
    const locByBg = await LocationRepository.findByBackgroundId(resolvedBg);
    if (locByBg && (!locByBg.campaignId || locByBg.campaignId === session.campaignId)) {
      locationId = locByBg.id;
    } else {
      const locById = await LocationRepository.findById(nextScene.locationId);
      if (locById && (!locById.campaignId || locById.campaignId === session.campaignId)) {
        locationId = locById.id;
      }
    }

    const candidateNpcId = nextScene.characterId || nextScene.speakerId;
    if (candidateNpcId) {
      const npc = await NPCRepository.findById(candidateNpcId);
      if (npc && (!npc.campaignId || npc.campaignId === session.campaignId)) {
        speakerId = npc.id;
      }
    }
  } catch (e) {}

  // 4. Create comprehensive snapshot via GameStateEngine
  const snapshotData = gameStateEngine.createSnapshot(character, session, currentNode);

  // 5. Create new StoryNode on active branch
  const choicesArr = safeArray(nextScene.choices);
  const newNode = await StoryNodeRepository.createNode(
    {
      sessionId: session.id,
      parentNodeId: currentNode.id,
      branchId: activeBranchId,
      status: 'ACTIVE',
      chapterTitle: nextScene.chapterTitle || `Babak ${session.turnCount}: Petualangan Berlanjut`,
      location: nextScene.location || 'Aetheria',
      locationId,
      backgroundId: resolvedBg,
      speaker: nextScene.speaker || 'Dungeon Master',
      speakerId,
      characterId: speakerId,
      turnNumber: session.turnCount,
      chosenActionText: chosenChoice?.text || null,
      chosenChoiceId: chosenChoice?.id || chosenChoice?.choiceKey || null,
      userActionInput: {
        choiceId: chosenChoice?.id || chosenChoice?.choiceKey,
        text: chosenChoice?.text,
        tone: chosenChoice?.tone,
        turnNumber: session.turnCount
      },
      mood: nextScene.mood || 'neutral',
      dialogueText: nextScene.dialogue,
      consequenceNote: nextScene.consequenceNote,
      choices: choicesArr,
      combatEncounter: nextScene.combatEncounter || null,
      characterSnapshot: snapshotData,
      gameStateSnapshot: snapshotData
    },
    choicesArr,
    snapshotData,
    transaction
  );

  // 6. Record player action explicitly into WorldFacts table (immutable history)
  if (chosenChoice?.text) {
    try {
      await WorldFactRepository.addFact({
        sessionId: session.id,
        campaignId: session.campaignId,
        subjectType: 'PLAYER_ACTION',
        subjectId: chosenChoice.id || 'choice',
        factType: 'ACTION_TAKEN',
        fact: `Babak ${session.turnCount}: Melakukan aksi "${chosenChoice.text}" (${chosenChoice.tone || 'cautious'}).`,
        turn: session.turnCount,
        branchId: activeBranchId,
        sourceNodeId: newNode.id
      }, transaction);
    } catch (e) {}
  }

  // 7. Record WorldFacts in database (history source of truth)
  if (stateUpdates.factDiscovered || stateUpdates.addLedgerFact) {
    const factText = stateUpdates.factDiscovered || stateUpdates.addLedgerFact;
    await WorldFactRepository.addFact({
      sessionId: session.id,
      campaignId: session.campaignId,
      subjectType: 'WORLD_EVENT',
      subjectId: locationId || 'location',
      factType: 'DISCOVERY',
      fact: factText,
      turn: session.turnCount,
      branchId: activeBranchId,
      sourceNodeId: newNode.id
    }, transaction);
  }

  for (const addedItem of (validatedUpdates.addedItems || [])) {
    await WorldFactRepository.addFact({
      sessionId: session.id,
      campaignId: session.campaignId,
      subjectType: 'ITEM',
      subjectId: addedItem.id,
      factType: 'ITEM_ACQUISITION',
      fact: `Memperoleh item: ${addedItem.name}`,
      turn: session.turnCount,
      branchId: activeBranchId,
      sourceNodeId: newNode.id
    }, transaction);
  }

  session.currentSceneId = newNode.id;
  await session.save({ transaction });

  return newNode;
}

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({ order: [['id', 'ASC']] });
    res.json({ success: true, data: campaigns });
  } catch (err) {
    logger.error('Failed to get campaigns', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.startCampaign = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const characterData = req.body.characterData || req.body.character || req.body || {};
    const campaignId = req.body.campaignId || characterData.campaignId;
    const campaign = await Campaign.findByPk(campaignId || 'whispering_tavern', { transaction });
    if (!campaign) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Kampanye tidak ditemukan.' });
    }

    const classPresets = {
      warrior: { hp: 35, maxHp: 35, mana: 10, maxMana: 10, str: 16, dex: 12, int: 8, wis: 10, cha: 10, con: 16, avatar: 'char_hero_01_paladin' },
      paladin: { hp: 35, maxHp: 35, mana: 15, maxMana: 15, str: 15, dex: 10, int: 10, wis: 14, cha: 14, con: 14, avatar: 'char_hero_01_paladin' },
      rogue: { hp: 28, maxHp: 28, mana: 15, maxMana: 15, str: 10, dex: 16, int: 12, wis: 12, cha: 14, con: 12, avatar: 'char_hero_02_ranger' },
      ranger: { hp: 30, maxHp: 30, mana: 15, maxMana: 15, str: 12, dex: 16, int: 10, wis: 14, cha: 10, con: 14, avatar: 'char_hero_02_ranger' },
      mage: { hp: 22, maxHp: 22, mana: 35, maxMana: 35, str: 8, dex: 12, int: 16, wis: 14, cha: 12, con: 10, avatar: 'char_hero_03_mage' },
      wizard: { hp: 22, maxHp: 22, mana: 35, maxMana: 35, str: 8, dex: 12, int: 16, wis: 14, cha: 12, con: 10, avatar: 'char_hero_03_mage' },
      cleric: { hp: 30, maxHp: 30, mana: 25, maxMana: 25, str: 12, dex: 10, int: 10, wis: 16, cha: 12, con: 14, avatar: 'char_hero_01_paladin' },
      bard: { hp: 26, maxHp: 26, mana: 25, maxMana: 25, str: 10, dex: 14, int: 12, wis: 10, cha: 16, con: 12, avatar: 'char_hero_02_ranger' },
      warlock: { hp: 26, maxHp: 26, mana: 30, maxMana: 30, str: 8, dex: 12, int: 14, wis: 12, cha: 16, con: 12, avatar: 'char_hero_03_mage' }
    };

    const chosenClass = (characterData?.characterClass || 'warrior').toLowerCase();
    const preset = classPresets[chosenClass] || classPresets.warrior;

    // Canonical inventory reference
    const initialInventory = [{ itemId: 'item_01_potion_heal', quantity: 1 }];

    if (characterData?.starterItemId || characterData?.starterItem) {
      const starterId = characterData.starterItemId || (typeof characterData.starterItem === 'object' ? characterData.starterItem.id : characterData.starterItem);
      const validItem = await ItemRepository.findById(starterId);
      if (validItem) {
        initialInventory.push({ itemId: validItem.id, quantity: 1 });
      }
    }

    const character = await Character.create({
      name: characterData?.name || 'Petualang Aether',
      race: characterData?.race || 'human',
      characterClass: chosenClass,
      level: 1,
      hp: preset.hp,
      maxHp: preset.maxHp,
      mana: preset.mana,
      maxMana: preset.maxMana,
      gold: 40,
      armorClass: 10 + Math.floor(((characterData?.dex || preset.dex) - 10) / 2),
      str: characterData?.str || preset.str,
      dex: characterData?.dex || preset.dex,
      int: characterData?.int || preset.int,
      wis: characterData?.wis || preset.wis,
      cha: characterData?.cha || preset.cha,
      con: characterData?.con || preset.con,
      avatarUrl: characterData?.avatarUrl || preset.avatar,
      inventory: initialInventory,
      equippedItems: characterData?.equippedItems || [],
      statusEffects: []
    }, { transaction });

    // Initialize deterministic quest state from Database
    const initialMission = questEngine.initializeMissionLog(campaign);

    const session = await GameSession.create({
      campaignId: campaign.id,
      characterId: character.id,
      turnCount: 1,
      activeBranchId: 'main',
      questState: initialMission.questState || {},
      missionLog: initialMission,
      worldLedger: {
        questFlags: { started: true },
        reputation: {}
      },
      isGameOver: false
    }, { transaction });

    // Generate opening narrative scene
    const openingScene = await geminiService.generateOpeningScene(campaign, character);

    // Validate if opening scene gave a registered item
    if (openingScene.stateUpdates?.receivedItemId) {
      const validItem = await ItemRepository.findById(openingScene.stateUpdates.receivedItemId);
      if (validItem) {
        itemMaster.addItem(character, validItem.id, 1);
        await character.save({ transaction });
      }
    }

    const startingBgId = (openingScene.backgroundId && openingScene.backgroundId !== 'bg_01_tavern')
      ? openingScene.backgroundId
      : (campaign.defaultBackgroundId || 'bg_01_tavern');

    // Resolve locationId and speakerId
    let startLocId = null;
    let startSpeakerId = null;
    try {
      const loc = await LocationRepository.findByBackgroundId(startingBgId);
      startLocId = loc?.id || null;
      const npc = await NPCRepository.findById(openingScene.characterId || campaign.defaultNpcId);
      startSpeakerId = npc?.id || null;
    } catch (e) {}

    const initialSnapshot = gameStateEngine.createSnapshot(character, session, null);

    const openingChoices = safeArray(openingScene.choices);
    const rootNode = await StoryNodeRepository.createNode(
      {
        sessionId: session.id,
        parentNodeId: null,
        branchId: 'main',
        status: 'ACTIVE',
        chapterTitle: openingScene.chapterTitle || 'Babak I: Panggilan Takdir',
        location: openingScene.location || 'Aetheria',
        locationId: startLocId,
        backgroundId: startingBgId,
        speaker: openingScene.speaker || 'Dungeon Master',
        speakerId: startSpeakerId,
        characterId: startSpeakerId,
        turnNumber: 1,
        mood: openingScene.mood || 'neutral',
        dialogueText: openingScene.dialogue,
        consequenceNote: openingScene.consequenceNote,
        choices: openingChoices,
        combatEncounter: openingScene.combatEncounter || null,
        characterSnapshot: initialSnapshot,
        gameStateSnapshot: initialSnapshot
      },
      openingChoices,
      initialSnapshot,
      transaction
    );

    // Persist initial world fact
    await WorldFactRepository.addFact({
      sessionId: session.id,
      campaignId: campaign.id,
      subjectType: 'WORLD_EVENT',
      subjectId: startLocId || 'tavern',
      factType: 'CAMPAIGN_START',
      fact: `Memulai petualangan di ${campaign.title}.`,
      turn: 1,
      branchId: 'main',
      sourceNodeId: rootNode.id
    }, transaction);

    session.currentSceneId = rootNode.id;
    await session.save({ transaction });
    await transaction.commit();

    const hydratedInv = await ItemRepository.hydrateInventory(character.inventory);

    logger.info('Game session started successfully', {
      sessionId: session.id,
      characterId: character.id,
      campaignId: campaign.id
    });

    res.json({
      success: true,
      data: {
        session,
        character: {
          ...character.toJSON(),
          inventory: hydratedInv
        },
        campaign,
        currentNode: rootNode
      }
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('startCampaign Error', err);
    res.status(500).json({ success: false, error: 'Internal server error saat memulai kampanye.' });
  }
};

exports.submitAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { sessionId, choiceId, customText, tone } = req.body;
    if (!sessionId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign],
      transaction
    });
    if (!session) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    const currentNode = await StoryNode.findByPk(session.currentSceneId, {
      include: [{ model: StoryChoice, as: 'choiceList' }],
      transaction
    });
    if (!currentNode) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Node cerita aktif tidak ditemukan.' });
    }

    const character = session.Character;
    const hpBefore = character.hp;

    // Approach B Branching: If player is taking a new choice from a node that already had children, mark old future branch ABANDONED
    const existingChildren = await StoryNode.findAll({
      where: {
        sessionId: session.id,
        parentNodeId: currentNode.id,
        status: 'ACTIVE'
      },
      transaction
    });

    if (existingChildren.length > 0) {
      await StoryNodeRepository.abandonFutureNodes(session.id, currentNode, transaction);
      const branchCount = await StoryNode.count({
        where: { sessionId: session.id },
        distinct: true,
        col: 'branchId',
        transaction
      });
      session.activeBranchId = `branch_${branchCount + 1}`;
      await session.save({ transaction });
    }

    // Direct game resolution check: Block premature finish_game unless quest objectives are completed
    if (choiceId === 'finish_game') {
      const evalEnding = questEngine.evaluateObjectives(
        session,
        session.Campaign,
        session.worldLedger,
        { choiceId: 'finish_game', currentNode }
      );

      if (!evalEnding.canTriggerEnding) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Kamu belum dapat menyelesaikan petualangan karena objektif misi utama belum tuntas.'
        });
      }

      session.isGameOver = true;
      await session.save({ transaction });
      await transaction.commit();

      const hydratedInv = await ItemRepository.hydrateInventory(character.inventory);

      return res.json({
        success: true,
        data: {
          session,
          character: {
            ...character.toJSON(),
            inventory: hydratedInv
          },
          currentNode,
          checkResult: null
        }
      });
    }

    const chosenChoice = resolveChoice(currentNode, choiceId, customText, tone);
    const recentHistory = await getRecentStoryHistory(session.id, currentNode.id, 4);

    // Call narrative generation with validated world context
    const nextScene = await geminiService.generateNextScene({
      session,
      character,
      previousNode: currentNode,
      actionTaken: chosenChoice,
      recentHistory,
      worldLedger: session.worldLedger,
      questState: session.questState || session.missionLog
    });

    const newNode = await advanceStoryState({
      session,
      character,
      currentNode,
      chosenChoice,
      nextScene,
      transaction
    });

    await transaction.commit();

    const hydratedInv = await ItemRepository.hydrateInventory(character.inventory);

    logger.logPlayerTurn({
      turn: session.turnCount,
      sessionId: session.id,
      playerAction: chosenChoice.text,
      resolvedIntent: chosenChoice.tone || 'NORMAL',
      hpBefore,
      hpAfter: character.hp,
      narrativeResult: nextScene.dialogue?.substring(0, 100)
    });

    res.json({
      success: true,
      data: {
        session,
        character: {
          ...character.toJSON(),
          inventory: hydratedInv
        },
        currentNode: newNode,
        checkResult: null
      }
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('submitAction Error', err);
    res.status(500).json({ success: false, error: 'Internal server error saat memproses tindakan narasi.' });
  }
};

exports.actionStream = async (req, res) => {
  const sessionId = req.body?.sessionId || req.query?.sessionId;
  const choiceId = req.body?.choiceId || req.query?.choiceId;
  const customText = req.body?.customText || req.query?.customText;

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const transaction = await sequelize.transaction();
  try {
    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign],
      transaction
    });
    if (!session) {
      await transaction.rollback();
      res.write(`data: ${JSON.stringify({ error: 'Sesi tidak ditemukan' })}\n\n`);
      return res.end();
    }

    const currentNode = await StoryNode.findByPk(session.currentSceneId, {
      include: [{ model: StoryChoice, as: 'choiceList' }],
      transaction
    });
    if (!currentNode) {
      await transaction.rollback();
      res.write(`data: ${JSON.stringify({ error: 'Node cerita aktif tidak ditemukan' })}\n\n`);
      return res.end();
    }

    const character = session.Character;

    // Check branching
    const existingChildren = await StoryNode.findAll({
      where: {
        sessionId: session.id,
        parentNodeId: currentNode.id,
        status: 'ACTIVE'
      },
      transaction
    });
    if (existingChildren.length > 0) {
      await StoryNodeRepository.abandonFutureNodes(session.id, currentNode, transaction);
      const branchCount = await StoryNode.count({
        where: { sessionId: session.id },
        distinct: true,
        col: 'branchId',
        transaction
      });
      session.activeBranchId = `branch_${branchCount + 1}`;
      await session.save({ transaction });
    }

    if (choiceId === 'finish_game') {
      const evalEnding = questEngine.evaluateObjectives(
        session,
        session.Campaign,
        session.worldLedger,
        { choiceId: 'finish_game', currentNode }
      );

      if (!evalEnding.canTriggerEnding) {
        await transaction.rollback();
        res.write(`data: ${JSON.stringify({ error: 'Objektif misi utama belum tuntas.' })}\n\n`);
        return res.end();
      }

      session.isGameOver = true;
      await session.save({ transaction });
      await transaction.commit();

      const hydratedInv = await ItemRepository.hydrateInventory(character.inventory);

      res.write(`data: ${JSON.stringify({
        type: 'done',
        data: {
          session,
          character: {
            ...character.toJSON(),
            inventory: hydratedInv
          },
          currentNode,
          checkResult: null
        }
      })}\n\n`);
      return res.end();
    }

    const chosenChoice = resolveChoice(currentNode, choiceId, customText, 'kreatif');
    const recentHistory = await getRecentStoryHistory(session.id, currentNode.id, 4);

    const nextScene = await geminiService.generateNextScene({
      session,
      character,
      previousNode: currentNode,
      actionTaken: chosenChoice,
      recentHistory,
      worldLedger: session.worldLedger,
      questState: session.questState || session.missionLog
    });

    const words = (nextScene.dialogue || '').split(' ');
    for (let i = 0; i < words.length; i++) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: (i === 0 ? '' : ' ') + words[i] })}\n\n`);
    }

    const newNode = await advanceStoryState({
      session,
      character,
      currentNode,
      chosenChoice,
      nextScene,
      transaction
    });

    await transaction.commit();

    const hydratedInv = await ItemRepository.hydrateInventory(character.inventory);

    res.write(`data: ${JSON.stringify({
      type: 'done',
      data: {
        session,
        character: {
          ...character.toJSON(),
          inventory: hydratedInv
        },
        currentNode: newNode,
        checkResult: null
      }
    })}\n\n`);
    res.end();
  } catch (err) {
    await transaction.rollback();
    logger.error('actionStream Error', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Internal server error saat streaming narasi.' })}\n\n`);
    res.end();
  }
};

/**
 * Server-Side Tactical Combat Action Endpoint
 * UNCHANGED: Respects strict combat engine freeze rules.
 */
exports.combatAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { sessionId, action, itemId } = req.body;
    if (!sessionId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character],
      transaction
    });
    if (!session || !session.Character) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Sesi atau karakter tidak ditemukan.' });
    }

    const character = session.Character;
    const currentNode = await StoryNode.findByPk(session.currentSceneId, { transaction });

    // Validate encounter existence: Rejects phantom combat
    const validation = combatEngine.validateCombatEncounter(session, currentNode);
    if (!validation.valid) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: validation.error || 'Tidak ada encounter pertarungan aktif di adegan saat ini.'
      });
    }

    // Execute server-side turn calculation
    const combatResult = combatEngine.executeCombatAction({
      session,
      character,
      currentNode,
      action: action || 'ATTACK',
      itemId
    });

    if (!combatResult.success) {
      await transaction.rollback();
      return res.status(combatResult.statusCode || 400).json({
        success: false,
        error: combatResult.error
      });
    }

    // Persist combat state, character stats, and session
    session.combatState = combatResult.combatState;
    if (combatResult.isGameOver) {
      session.isGameOver = true;
    }

    if (combatResult.isVictory && currentNode) {
      currentNode.combatEncounter = null;
      await currentNode.save({ transaction });
    }

    await character.save({ transaction });
    await session.save({ transaction });
    await transaction.commit();

    logger.logCombatAction({
      sessionId: session.id,
      round: combatResult.combatState?.round || 1,
      action: action || 'ATTACK',
      enemyName: combatResult.combatState?.enemy?.name,
      damageDealt: combatResult.playerDamageDealt || 0,
      damageReceived: combatResult.enemyDamageDealt || 0,
      playerHp: character.hp,
      enemyHp: combatResult.combatState?.enemy?.hp,
      status: combatResult.isVictory ? 'VICTORY' : (combatResult.isGameOver ? 'DEFEAT' : 'ACTIVE')
    });

    const hydratedInv = await ItemRepository.hydrateInventory(character.inventory);

    return res.json({
      success: true,
      message: combatResult.actionLog,
      data: {
        session,
        character: {
          ...character.toJSON(),
          inventory: hydratedInv
        },
        combatState: combatResult.combatState,
        isGameOver: Boolean(session.isGameOver),
        isVictory: Boolean(combatResult.isVictory),
        isFled: Boolean(combatResult.isFled),
        actionLog: combatResult.actionLog
      }
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('combatAction Error', err);
    res.status(500).json({ success: false, error: 'Internal server error saat memproses pertarungan.' });
  }
};

/**
 * Use Item through GameStateEngine, Event Pipeline, and Snapshot creation
 */
exports.useItem = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { sessionId, itemId } = req.body;
    if (!sessionId || !itemId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'sessionId dan itemId wajib disertakan.' });
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign],
      transaction
    });
    if (!session || !session.Character) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Sesi atau karakter tidak ditemukan.' });
    }

    const currentNode = await StoryNode.findByPk(session.currentSceneId, { transaction });
    const character = session.Character;

    // Execute through GameStateEngine deterministic action pipeline
    const actionResult = gameStateEngine.resolveAction(
      session,
      character,
      currentNode,
      { actionType: 'USE_ITEM', itemId }
    );

    if (!actionResult.validatedUpdates.removedItems || actionResult.validatedUpdates.removedItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `Item "${itemId}" tidak dapat digunakan atau tidak ditemukan di inventaris.`
      });
    }

    // Save mutations atomically
    await character.save({ transaction });
    await session.save({ transaction });

    // Record WorldFact for item usage linked to active branch
    const consumedItem = actionResult.validatedUpdates.removedItems[0];
    await WorldFactRepository.addFact({
      sessionId: session.id,
      campaignId: session.campaignId,
      subjectType: 'ITEM',
      subjectId: consumedItem.id,
      factType: 'USE_ITEM',
      fact: `Menggunakan ${consumedItem.name || itemId}.`,
      turn: session.turnCount,
      branchId: session.activeBranchId || 'main',
      sourceNodeId: currentNode?.id || null
    }, transaction);

    // Update official StorySnapshot
    if (currentNode?.id) {
      const snapData = gameStateEngine.createSnapshot(character, session, currentNode);
      await StorySnapshot.upsert({
        storyNodeId: currentNode.id,
        characterState: snapData.characterState,
        inventoryState: snapData.inventoryState,
        questState: snapData.questState,
        worldState: snapData.worldState,
        ledgerState: snapData.ledgerState
      }, { transaction });
    }

    await transaction.commit();

    const hydratedInv = await ItemRepository.hydrateInventory(character.inventory);

    return res.json({
      success: true,
      message: `Berhasil menggunakan ${consumedItem.name || 'item'}.`,
      data: {
        character: {
          ...character.toJSON(),
          inventory: hydratedInv
        },
        session
      }
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('useItem Error', err);
    res.status(500).json({ success: false, error: 'Internal server error saat menggunakan item.' });
  }
};

exports.rewindToNode = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { sessionId, targetNodeId } = req.body;
    if (!sessionId || !targetNodeId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'sessionId dan targetNodeId wajib disertakan.' });
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character],
      transaction
    });
    if (!session) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan.' });
    }

    const targetNode = await StoryNode.findOne({
      where: { id: targetNodeId, sessionId },
      include: [
        { model: StoryChoice, as: 'choiceList' },
        { model: StorySnapshot, as: 'snapshot' }
      ],
      transaction
    });
    if (!targetNode) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Node target tidak valid untuk sesi ini.' });
    }

    // Atomic restoration via GameStateEngine using official StorySnapshot
    await gameStateEngine.restoreSnapshot(targetNode, session, session.Character, transaction);

    await session.Character.save({ transaction });
    await session.save({ transaction });
    await transaction.commit();

    const hydratedInv = await ItemRepository.hydrateInventory(session.Character.inventory);

    logger.info('Session rewound successfully', {
      sessionId,
      targetNodeId,
      turnCount: session.turnCount,
      restoredHp: session.Character?.hp,
      activeBranchId: session.activeBranchId
    });

    res.json({
      success: true,
      data: {
        session,
        character: {
          ...session.Character.toJSON(),
          inventory: hydratedInv
        },
        currentNode: targetNode
      }
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('rewindToNode Error', err);
    res.status(500).json({ success: false, error: 'Internal server error saat melakukan rewind.' });
  }
};

exports.getStoryTree = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const nodes = await StoryNodeRepository.findStoryTree(sessionId);
    res.json({ success: true, data: nodes });
  } catch (err) {
    logger.error('getStoryTree Error', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getBacklog = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await GameSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan.' });
    }

    // Backlog follows the active branch path to root
    const nodes = await StoryNode.findAll({
      where: { sessionId },
      include: [{ model: StoryChoice, as: 'choiceList' }]
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const chain = [];
    let curr = nodeMap.get(session.currentSceneId);
    while (curr) {
      chain.unshift(curr);
      curr = curr.parentNodeId ? nodeMap.get(curr.parentNodeId) : null;
    }

    res.json({ success: true, data: chain });
  } catch (err) {
    logger.error('getBacklog Error', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getGameSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan.' });
    }

    const finalNodes = await StoryNodeRepository.findActiveTimeline(sessionId, session.activeBranchId);

    const character = session.Character;
    const campaign = session.Campaign;
    const activeWorldFacts = await WorldFactRepository.findActiveBranchFacts(sessionId, session.activeBranchId);

    res.json({
      success: true,
      data: {
        campaignTitle: campaign?.title || 'Petualangan Aether',
        characterName: character?.name || 'Pahlawan',
        characterClass: character?.characterClass || 'Petualang',
        totalStages: finalNodes.length,
        isVictory: character ? character.hp > 0 && session.isGameOver : false,
        finalHp: character?.hp || 0,
        maxHp: character?.maxHp || 30,
        finalGold: character?.gold || 0,
        inventoryCount: character?.inventory?.length || 0,
        timeline: finalNodes.map((n, idx) => ({
          stage: idx + 1,
          title: n.chapterTitle,
          location: n.location,
          speaker: n.speaker,
          consequence: n.consequenceNote || 'Perjalanan berlanjut ke wilayah berikutnya.'
        })),
        milestones: activeWorldFacts.map(f => ({ turn: f.turn, fact: f.fact }))
      }
    });
  } catch (err) {
    logger.error('getGameSummary Error', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getItems = async (req, res) => {
  try {
    const items = await ItemRepository.findAll();
    res.json({ success: true, data: items });
  } catch (err) {
    logger.error('getItems Error', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data item.' });
  }
};

exports.getNpcs = async (req, res) => {
  try {
    const { campaignId } = req.query;
    const npcs = campaignId ? await NPCRepository.findByCampaign(campaignId) : await NPCRepository.findAll();
    res.json({ success: true, data: npcs });
  } catch (err) {
    logger.error('getNpcs Error', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data NPC.' });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const { campaignId } = req.query;
    const locations = campaignId ? await LocationRepository.findByCampaign(campaignId) : await LocationRepository.findAll();
    res.json({ success: true, data: locations });
  } catch (err) {
    logger.error('getLocations Error', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data lokasi.' });
  }
};

exports.getQuests = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const quests = await QuestRepository.findByCampaign(campaignId);
    res.json({ success: true, data: quests });
  } catch (err) {
    logger.error('getQuests Error', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data quest.' });
  }
};

/**
 * Journal strictly reads from Active Branch timeline and Active World Facts
 */
exports.getJournal = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan.' });
    }

    const activeBranchId = session.activeBranchId || 'main';

    // 1. Facts from Active Branch only
    const worldFacts = await WorldFactRepository.findActiveBranchFacts(sessionId, activeBranchId);

    // 2. Nodes from Active Branch only
    const activeNodes = await StoryNodeRepository.findActiveTimeline(sessionId, activeBranchId);

    const visitedLocationNames = new Set();
    const visitedLocations = [];
    for (const node of activeNodes) {
      if (node.location && !visitedLocationNames.has(node.location)) {
        visitedLocationNames.add(node.location);
        visitedLocations.push({
          location: node.location,
          backgroundId: node.backgroundId,
          firstVisitedTurn: node.turnNumber || 1
        });
      }
    }

    const metNpcNames = new Set();
    const metNpcs = [];
    for (const node of activeNodes) {
      if (node.speaker && node.speaker !== 'Narator' && node.speaker !== 'DM' && !metNpcNames.has(node.speaker)) {
        metNpcNames.add(node.speaker);
        metNpcs.push({
          speaker: node.speaker,
          characterId: node.characterId,
          firstMetTurn: node.turnNumber || 1
        });
      }
    }

    const campaignQuests = session.campaignId ? await QuestRepository.findByCampaign(session.campaignId) : [];
    const hydratedInv = session.Character?.inventory
      ? await ItemRepository.hydrateInventory(session.Character.inventory)
      : [];

    res.json({
      success: true,
      data: {
        sessionId,
        campaign: session.Campaign,
        character: {
          ...session.Character?.toJSON(),
          inventory: hydratedInv
        },
        missionLog: session.missionLog,
        questState: session.questState,
        activeBranchId,
        visitedLocations,
        metNpcs,
        worldFacts,
        quests: campaignQuests,
        reputation: session.worldLedger?.reputation || {}
      }
    });
  } catch (err) {
    logger.error('getJournal Error', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data jurnal.' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    const character = session.Character;
    const currentNode = await StoryNode.findByPk(session.currentSceneId, {
      include: [{ model: StoryChoice, as: 'choiceList' }]
    });

    if (!currentNode) {
      return res.status(404).json({ success: false, error: 'Node cerita aktif tidak ditemukan.' });
    }

    const hydratedInv = character?.inventory
      ? await ItemRepository.hydrateInventory(character.inventory)
      : [];

    let choices = safeArray(currentNode.choices);
    if ((!choices || choices.length === 0) && currentNode.choiceList?.length > 0) {
      choices = currentNode.choiceList.map(c => ({
        id: c.choiceKey,
        choiceKey: c.choiceKey,
        text: c.text,
        actionType: c.actionType,
        tone: c.tone
      }));
    }

    res.json({
      success: true,
      data: {
        session,
        character: {
          ...character.toJSON(),
          inventory: hydratedInv
        },
        currentNode: {
          ...currentNode.toJSON(),
          choices
        },
        campaign: session.Campaign,
        combatState: session.combatState || null
      }
    });
  } catch (err) {
    logger.error('getSession Error', err);
    res.status(500).json({ success: false, error: 'Internal server error saat memuat sesi aktif.' });
  }
};

