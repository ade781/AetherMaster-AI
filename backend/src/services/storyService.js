const {
  Character,
  Campaign,
  GameSession,
  StoryNode,
  StoryChoice,
  StorySnapshot
} = require('../models');
const { sequelize } = require('../config/database');
const geminiService = require('./geminiService');
const combatEngine = require('../engine/combatEngine');
const gameStateEngine = require('../engine/gameStateEngine');
const itemMaster = require('../engine/itemMaster');
const questEngine = require('../engine/questEngine');
const logger = require('../utils/logger');
const {
  ItemRepository,
  NPCRepository,
  LocationRepository,
  WorldFactRepository,
  StoryNodeRepository
} = require('../repositories');
const { campaignsData } = require('../models/seeders/campaignSeeder');

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
 * Single-pass deterministic background resolution.
 * Campaign -> Location -> StoryNode -> Scene
 */
function resolveBackground(candidateBg, currentBg, campaignBg) {
  if (candidateBg && candidateBg !== 'bg_01_tavern') {
    return candidateBg;
  }
  return currentBg || campaignBg || 'bg_01_tavern';
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

  // 2. Resolve background ID deterministically
  const resolvedBg = resolveBackground(
    nextScene?.backgroundId,
    currentNode?.backgroundId,
    session.Campaign?.defaultBackgroundId
  );

  // 3. Resolve locationId and speakerId from database
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

  // 6. Record player action into WorldFacts table
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

  // 7. Record WorldFacts for discoveries and item acquisition
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

class StoryService {
  async getCampaigns() {
    try {
      const campaigns = await Campaign.findAll({ order: [['id', 'ASC']] });
      if (campaigns && campaigns.length > 0) {
        return campaigns;
      }
      return campaignsData;
    } catch (err) {
      logger.warn('[StoryService.getCampaigns] Database error, falling back to static campaign data:', err.message);
      return campaignsData;
    }
  }

  async startCampaign({ campaignId, characterData = {} }) {
    const transaction = await sequelize.transaction();
    try {
      const targetCampaignId = campaignId || characterData.campaignId || 'whispering_tavern';
      const campaign = await Campaign.findByPk(targetCampaignId, { transaction });
      if (!campaign) {
        await transaction.rollback();
        const err = new Error('Kampanye tidak ditemukan.');
        err.statusCode = 404;
        throw err;
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

      const openingScene = await geminiService.generateOpeningScene(campaign, character);

      if (openingScene.stateUpdates?.receivedItemId) {
        const validItem = await ItemRepository.findById(openingScene.stateUpdates.receivedItemId);
        if (validItem) {
          itemMaster.addItem(character, validItem.id, 1);
          await character.save({ transaction });
        }
      }

      const startingBgId = resolveBackground(
        openingScene.backgroundId,
        null,
        campaign.defaultBackgroundId
      );

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

      return {
        session,
        character: {
          ...character.toJSON(),
          inventory: hydratedInv
        },
        campaign,
        currentNode: rootNode
      };
    } catch (err) {
      await transaction.rollback();
      logger.error('startCampaign Error', err);
      throw err;
    }
  }

  async submitAction({ sessionId, choiceId, customText, tone }) {
    if (!sessionId) {
      const err = new Error('sessionId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const transaction = await sequelize.transaction();
    try {
      const session = await GameSession.findByPk(sessionId, {
        include: [Character, Campaign],
        transaction
      });
      if (!session) {
        await transaction.rollback();
        const err = new Error('Sesi permainan tidak ditemukan.');
        err.statusCode = 404;
        throw err;
      }

      const currentNode = await StoryNode.findByPk(session.currentSceneId, {
        include: [{ model: StoryChoice, as: 'choiceList' }],
        transaction
      });
      if (!currentNode) {
        await transaction.rollback();
        const err = new Error('Node cerita aktif tidak ditemukan.');
        err.statusCode = 404;
        throw err;
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
          const err = new Error('Kamu belum dapat menyelesaikan petualangan karena objektif misi utama belum tuntas.');
          err.statusCode = 400;
          throw err;
        }

        session.isGameOver = true;
        await session.save({ transaction });
        await transaction.commit();

        const hydratedInv = await ItemRepository.hydrateInventory(character.inventory);

        return {
          session,
          character: {
            ...character.toJSON(),
            inventory: hydratedInv
          },
          currentNode,
          checkResult: null
        };
      }

      const chosenChoice = resolveChoice(currentNode, choiceId, customText, tone);
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

      return {
        session,
        character: {
          ...character.toJSON(),
          inventory: hydratedInv
        },
        currentNode: newNode,
        checkResult: null
      };
    } catch (err) {
      await transaction.rollback();
      logger.error('submitAction Error', err);
      throw err;
    }
  }

  async combatAction({ sessionId, action, itemId }) {
    if (!sessionId) {
      const err = new Error('sessionId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const transaction = await sequelize.transaction();
    try {
      const session = await GameSession.findByPk(sessionId, {
        include: [Character],
        transaction
      });
      if (!session || !session.Character) {
        await transaction.rollback();
        const err = new Error('Sesi atau karakter tidak ditemukan.');
        err.statusCode = 404;
        throw err;
      }

      const character = session.Character;
      const currentNode = await StoryNode.findByPk(session.currentSceneId, { transaction });

      const validation = combatEngine.validateCombatEncounter(session, currentNode);
      if (!validation.valid) {
        await transaction.rollback();
        const err = new Error(validation.error || 'Tidak ada encounter pertarungan aktif di adegan saat ini.');
        err.statusCode = 400;
        throw err;
      }

      const combatResult = combatEngine.executeCombatAction({
        session,
        character,
        currentNode,
        action: action || 'ATTACK',
        itemId
      });

      if (!combatResult.success) {
        await transaction.rollback();
        const err = new Error(combatResult.error);
        err.statusCode = combatResult.statusCode || 400;
        throw err;
      }

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

      return {
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
      };
    } catch (err) {
      await transaction.rollback();
      logger.error('combatAction Error', err);
      throw err;
    }
  }

  async useItem({ sessionId, itemId }) {
    if (!sessionId || !itemId) {
      const err = new Error('sessionId dan itemId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const transaction = await sequelize.transaction();
    try {
      const session = await GameSession.findByPk(sessionId, {
        include: [Character, Campaign],
        transaction
      });
      if (!session || !session.Character) {
        await transaction.rollback();
        const err = new Error('Sesi atau karakter tidak ditemukan.');
        err.statusCode = 404;
        throw err;
      }

      const currentNode = await StoryNode.findByPk(session.currentSceneId, { transaction });
      const character = session.Character;

      const actionResult = gameStateEngine.resolveAction(
        session,
        character,
        currentNode,
        { actionType: 'USE_ITEM', itemId }
      );

      if (!actionResult.validatedUpdates.removedItems || actionResult.validatedUpdates.removedItems.length === 0) {
        await transaction.rollback();
        const err = new Error(`Item "${itemId}" tidak dapat digunakan atau tidak ditemukan di inventaris.`);
        err.statusCode = 400;
        throw err;
      }

      await character.save({ transaction });
      await session.save({ transaction });

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

      return {
        message: `Berhasil menggunakan ${consumedItem.name || 'item'}.`,
        data: {
          character: {
            ...character.toJSON(),
            inventory: hydratedInv
          },
          session
        }
      };
    } catch (err) {
      await transaction.rollback();
      logger.error('useItem Error', err);
      throw err;
    }
  }

  async rewindToNode({ sessionId, targetNodeId }) {
    if (!sessionId || !targetNodeId) {
      const err = new Error('sessionId dan targetNodeId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const transaction = await sequelize.transaction();
    try {
      const session = await GameSession.findByPk(sessionId, {
        include: [Character],
        transaction
      });
      if (!session) {
        await transaction.rollback();
        const err = new Error('Sesi tidak ditemukan.');
        err.statusCode = 404;
        throw err;
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
        const err = new Error('Node target tidak valid untuk sesi ini.');
        err.statusCode = 404;
        throw err;
      }

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

      return {
        session,
        character: {
          ...session.Character.toJSON(),
          inventory: hydratedInv
        },
        currentNode: targetNode
      };
    } catch (err) {
      await transaction.rollback();
      logger.error('rewindToNode Error', err);
      throw err;
    }
  }

  async getStoryTree(sessionId) {
    return await StoryNodeRepository.findStoryTree(sessionId);
  }

  async getBacklog(sessionId) {
    const session = await GameSession.findByPk(sessionId);
    if (!session) {
      const err = new Error('Sesi tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

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

    return chain;
  }

  async getSession(sessionId) {
    if (!sessionId) {
      const err = new Error('sessionId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      const err = new Error('Sesi permainan tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

    const character = session.Character;
    const currentNode = await StoryNode.findByPk(session.currentSceneId, {
      include: [{ model: StoryChoice, as: 'choiceList' }]
    });

    if (!currentNode) {
      const err = new Error('Node cerita aktif tidak ditemukan.');
      err.statusCode = 404;
      throw err;
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

    return {
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
    };
  }

  async getSessionSummary(sessionId) {
    if (!sessionId) {
      const err = new Error('sessionId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      const err = new Error('Sesi permainan tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

    const nodes = await StoryNode.findAll({
      where: { sessionId, status: 'ACTIVE' },
      order: [['turnNumber', 'ASC']]
    });

    const timeline = nodes.map(n => ({
      stage: n.turnNumber,
      title: n.chapterTitle || `Babak ${n.turnNumber}`,
      location: n.location || 'Aetheria',
      consequence: n.consequenceNote || n.dialogueText?.slice(0, 100) || 'Perjalanan berlanjut.'
    }));

    return {
      totalStages: session.turnCount || nodes.length || 1,
      finalHp: session.Character?.hp ?? 0,
      maxHp: session.Character?.maxHp ?? 30,
      finalGold: session.Character?.gold ?? 0,
      timeline
    };
  }
}

module.exports = new StoryService();
