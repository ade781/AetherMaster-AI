const {
  Character,
  Campaign,
  GameSession,
  StoryNode,
  StoryChoice
} = require('../../models');
const { sequelize } = require('../../config/database');
const geminiService = require('../geminiService');
const gameStateEngine = require('../../engine/gameStateEngine');
const questEngine = require('../../engine/questEngine');
const logger = require('../../utils/logger');
const {
  ItemRepository,
  NPCRepository,
  LocationRepository,
  WorldFactRepository,
  StoryNodeRepository
} = require('../../repositories');
const { safeArray, resolveChoice, getRecentStoryHistory, resolveBackground } = require('./storyCommon');

class StoryActionService {
  /**
   * Advance story state using centralized GameStateEngine and Game Event pipeline with atomic transaction.
   */
  async advanceStoryState({ session, character, currentNode, chosenChoice, nextScene, transaction }) {
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
    const factText = stateUpdates.factDiscovered || null;
    if (factText) {
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

      // Approach B Branching: If player takes choice from node that already had children, mark old future branch ABANDONED
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

      const newNode = await this.advanceStoryState({
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
}

module.exports = new StoryActionService();
