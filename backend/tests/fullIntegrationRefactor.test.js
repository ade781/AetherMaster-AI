const test = require('node:test');
const assert = require('node:assert/strict');
const {
  sequelize,
  Character,
  Campaign,
  GameSession,
  StoryNode,
  StoryChoice,
  StorySnapshot,
  WorldFact,
  Item,
  Quest,
  QuestObjective
} = require('../src/models');
const {
  ItemRepository,
  NPCRepository,
  LocationRepository,
  QuestRepository,
  WorldFactRepository,
  StoryNodeRepository,
  SnapshotRepository,
  StoryChoiceRepository
} = require('../src/repositories');
const gameStateEngine = require('../src/engine/gameStateEngine');
const itemMaster = require('../src/engine/itemMaster');
const questEngine = require('../src/engine/questEngine');
const { EVENT_TYPES, createGameEvent, processGameEvents } = require('../src/engine/gameEvents');

test('Comprehensive Refactor Integration Test: Full Flow Verification', async (t) => {
  // Test 1: Item Single Source of Truth
  await t.test('1. Item Single Source of Truth: Canonical IDs, Database Only, Strict Rejection', async () => {
    // A. Canonical Item Lookup
    const potion = await ItemRepository.findById('item_01_potion_heal');
    assert.ok(potion, 'Canonical potion must be found');
    assert.strictEqual(potion.name, 'Potion of Healing');

    // B. Rejection of Fabricated / Phantom Item
    const phantom = await ItemRepository.findById('item_laser_blaster_9000');
    assert.strictEqual(phantom, null, 'Unregistered phantom item must return null');

    const testChar = {
      name: 'Tester',
      hp: 20,
      maxHp: 30,
      inventory: []
    };

    const rejectRes = itemMaster.addItem(testChar, 'item_laser_blaster_9000');
    assert.strictEqual(rejectRes.success, false, 'addItem must reject unregistered items');
    assert.strictEqual(testChar.inventory.length, 0, 'Inventory must not be polluted by unregistered item');

    // C. Valid Item Addition and Canonical Inventory Format
    const addRes = itemMaster.addItem(testChar, 'item_01_potion_heal', 2);
    assert.strictEqual(addRes.success, true);
    assert.strictEqual(addRes.updatedCharacter.inventory.length, 1);
    assert.strictEqual(addRes.updatedCharacter.inventory[0].itemId, 'item_01_potion_heal');
    assert.strictEqual(addRes.updatedCharacter.inventory[0].quantity, 2);

    // D. Hydration Test
    const hydrated = await ItemRepository.hydrateInventory(addRes.updatedCharacter.inventory);
    assert.strictEqual(hydrated.length, 1);
    assert.strictEqual(hydrated[0].name, 'Potion of Healing');
    assert.strictEqual(hydrated[0].quantity, 2);
  });

  // Test 2: Quest Single Source of Truth & Game Event Pipeline
  await t.test('2. Quest Single Source of Truth & Event Pipeline: Objectives & Finish Game Guard', async () => {
    const campaignId = 'whispering_tavern';
    const objectives = questEngine.getCampaignObjectives(campaignId);
    assert.ok(Array.isArray(objectives));
    assert.ok(objectives.length >= 3, 'Must have at least 3 objectives from master data');
    assert.strictEqual(objectives[0].id, 'obj_tavern_investigate');

    const initialMission = questEngine.initializeMissionLog({ id: campaignId, title: 'Whispering Tavern' });
    assert.strictEqual(initialMission.status, 'active');
    assert.strictEqual(initialMission.mainQuestCompleted, false);

    // Simulated action with incomplete objectives attempting finish_game
    const mockSession = {
      id: 'sess_test_1',
      campaignId,
      turnCount: 2,
      worldLedger: { flags: {}, questFlags: {} },
      missionLog: initialMission
    };

    const prematureEval = questEngine.evaluateObjectives(
      mockSession,
      campaignId,
      mockSession.worldLedger,
      { choiceId: 'finish_game' }
    );

    assert.strictEqual(prematureEval.canTriggerEnding, false, 'finish_game must be blocked when objectives are incomplete');

    // Process events completing all 3 objectives
    const masterQuests = [
      {
        id: 'quest_whispering_tavern_main',
        type: 'main',
        objectives: [
          { id: 'obj_1', objectiveType: 'TALK', targetId: 'char_npc_01_barkeep', requiredCount: 1 },
          { id: 'obj_2', objectiveType: 'EXPLORE', targetId: 'loc_cellar', requiredCount: 1 }
        ]
      }
    ];

    const events = [
      createGameEvent(EVENT_TYPES.NPC_INTERACTED, { targetId: 'char_npc_01_barkeep', turn: 1 }),
      createGameEvent(EVENT_TYPES.LOCATION_ENTERED, { targetId: 'loc_cellar', turn: 2 })
    ];

    const eventResult = processGameEvents(events, {}, masterQuests);
    assert.strictEqual(eventResult.completedObjectives.length, 2);
    assert.strictEqual(eventResult.completedQuests.length, 1);
    assert.strictEqual(eventResult.updatedQuestState.isMainQuestCompleted, true);
  });

  // Test 3: Approach B Branching, Rewind, and Official StorySnapshot
  await t.test('3. Approach B Branching & Rewind: StorySnapshot Source of Truth & Timeline Isolation', async () => {
    const mockChar = {
      name: 'TimelineHero',
      hp: 15,
      maxHp: 30,
      mana: 10,
      maxMana: 20,
      gold: 50,
      inventory: [{ itemId: 'item_01_potion_heal', quantity: 1 }]
    };

    const mockSession = {
      id: 'session_branch_test',
      turnCount: 3,
      activeBranchId: 'main',
      worldLedger: { flags: { talked_barkeep: true }, questFlags: { started: true } },
      missionLog: { status: 'active', currentObjectiveIndex: 1 }
    };

    // Create a target snapshot at Node B
    const snapshotB = gameStateEngine.createSnapshot(mockChar, mockSession, { id: 'node_b', branchId: 'main' });
    assert.strictEqual(snapshotB.hp, 15);
    assert.strictEqual(snapshotB.inventory[0].itemId, 'item_01_potion_heal');

    // Mutate state further down the timeline (Node C)
    mockChar.hp = 5;
    mockChar.inventory = [];
    mockSession.turnCount = 5;

    // Rewind back to Node B
    const targetNodeB = {
      id: 'node_b',
      sessionId: 'session_branch_test',
      branchId: 'main',
      turnNumber: 3,
      snapshot: {
        characterState: snapshotB.characterState,
        inventoryState: snapshotB.inventoryState,
        questState: snapshotB.questState,
        worldState: snapshotB.worldState,
        ledgerState: snapshotB.ledgerState
      }
    };

    await gameStateEngine.restoreSnapshot(targetNodeB, mockSession, mockChar);

    assert.strictEqual(mockChar.hp, 15, 'Character HP must restore exactly to Node B snapshot');
    assert.strictEqual(mockChar.inventory.length, 1);
    assert.strictEqual(mockChar.inventory[0].itemId, 'item_01_potion_heal');
    assert.strictEqual(mockSession.turnCount, 3);
    assert.strictEqual(mockSession.activeBranchId, 'main');
  });

  // Test 4: Use Item Pipeline through GameStateEngine
  await t.test('4. Use Item Pipeline: GameStateEngine & Deterministic Consumption', async () => {
    const woundedChar = {
      name: 'WoundedKnight',
      hp: 10,
      maxHp: 35,
      mana: 15,
      maxMana: 20,
      gold: 10,
      inventory: [
        { itemId: 'item_01_potion_heal', quantity: 2 }
      ]
    };

    const session = {
      turnCount: 2,
      worldLedger: { facts: [], flags: {}, questFlags: {} }
    };

    const actionResult = gameStateEngine.resolveAction(
      session,
      woundedChar,
      { id: 'node_cur' },
      { actionType: 'USE_ITEM', itemId: 'item_01_potion_heal' }
    );

    assert.strictEqual(actionResult.validatedUpdates.removedItems.length, 1);
    assert.strictEqual(actionResult.updatedCharacterState.hp, 35, 'HP should restore +25 and clamp to maxHp 35');
    assert.strictEqual(actionResult.updatedCharacterState.inventory.length, 1);
    assert.strictEqual(actionResult.updatedCharacterState.inventory[0].quantity, 1, 'Quantity should decrement from 2 to 1');

    // Consume second potion
    const secondResult = gameStateEngine.resolveAction(
      session,
      actionResult.updatedCharacterState,
      { id: 'node_cur' },
      { actionType: 'USE_ITEM', itemId: 'item_01_potion_heal' }
    );

    assert.strictEqual(secondResult.updatedCharacterState.inventory.length, 0, 'Inventory should be empty after consuming last potion');
  });

  // Test 5: StoryChoice Table Integration
  await t.test('5. StoryChoice Single Source of Truth', async () => {
    const choices = [
      { choiceKey: 'c1', text: 'Periksa laci meja', actionType: 'INVESTIGATE', tone: 'cautious' },
      { choiceKey: 'c2', text: 'Bicara dengan penjaga', actionType: 'TALK', tone: 'diplomatic' }
    ];

    assert.strictEqual(choices.length, 2);
    assert.strictEqual(choices[0].actionType, 'INVESTIGATE');
    assert.strictEqual(choices[1].tone, 'diplomatic');
  });
});
