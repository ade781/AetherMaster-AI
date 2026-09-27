const { Character, Campaign, GameSession, StoryNode } = require('../models');
const { sequelize } = require('../config/database');
const geminiService = require('../services/geminiService');
const combatEngine = require('../engine/combatEngine');
const logger = require('../utils/logger');
const { getEffectiveStats } = require('../utils/statEngine');

// Safely attempt to require Agent 1 engine modules (if already exported via ../engine/index.js)
let agent1Engine = null;
try {
  agent1Engine = require('../engine');
} catch (e) {
  // Graceful fallback if Agent 1 is executing concurrently
  agent1Engine = null;
}

const gameStateEngine = agent1Engine?.gameStateEngine || null;
const itemMaster = agent1Engine?.itemMaster || null;
const questEngine = agent1Engine?.questEngine || null;
const worldLedgerService = agent1Engine?.worldLedgerService || null;

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

/**
 * Standard Item Catalog fallback (mirrors Agent 1 Item Master)
 */
const DEFAULT_ITEM_CATALOG = {
  item_01_potion_heal: {
    id: 'item_01_potion_heal',
    name: 'Potion of Healing',
    category: 'consumable',
    effect: { hp: 25, mana: 0 },
    icon: 'item_01_potion_heal'
  },
  item_01_health_potion: {
    id: 'item_01_health_potion',
    name: 'Potion of Healing',
    category: 'consumable',
    effect: { hp: 25, mana: 0 },
    icon: 'potion_heal'
  },
  item_02_mana_potion: {
    id: 'item_02_mana_potion',
    name: 'Potion of Mana',
    category: 'consumable',
    effect: { hp: 0, mana: 25 },
    icon: 'item_02_mana_potion'
  },
  item_03_elixir: {
    id: 'item_03_elixir',
    name: 'Elixir of Vitality',
    category: 'consumable',
    effect: { hp: 50, mana: 30 },
    icon: 'item_03_elixir'
  },
  item_04_ration: {
    id: 'item_04_ration',
    name: 'Ration Pack',
    category: 'consumable',
    effect: { hp: 10, mana: 0 },
    icon: 'item_04_ration'
  }
};

/**
 * Normalizes item ID and looks up master item data
 */
function resolveItemData(itemIdOrName) {
  if (itemMaster?.getItem) {
    const item = itemMaster.getItem(itemIdOrName);
    if (item) return item;
  }
  const cleanId = String(itemIdOrName || '').toLowerCase().trim();
  if (DEFAULT_ITEM_CATALOG[cleanId]) return DEFAULT_ITEM_CATALOG[cleanId];
  return Object.values(DEFAULT_ITEM_CATALOG).find(i =>
    i.id.toLowerCase() === cleanId || i.name.toLowerCase() === cleanId
  ) || null;
}

function resolveChoice(currentNode, choiceId, customText, tone) {
  const choiceList = safeArray(currentNode?.choices);
  const matched = choiceList.find(c => c && (c.id === choiceId || c.text === choiceId));
  if (matched) return matched;

  const text = customText || (typeof choiceId === 'string' && choiceId !== 'custom' ? choiceId : 'Melangkah maju dengan waspada');

  return {
    id: choiceId || 'custom',
    text,
    tone: tone || 'kreatif'
  };
}

async function getRecentStoryHistory(sessionId, currentSceneId, limit = 4) {
  try {
    const nodes = await StoryNode.findAll({
      where: { sessionId },
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
 * Creates comprehensive game state snapshot for atomic rewind & save slots.
 */
function createGameStateSnapshot(character, session, currentNode) {
  if (gameStateEngine?.createSnapshot) {
    return gameStateEngine.createSnapshot(character, session, currentNode);
  }
  return {
    hp: character.hp,
    maxHp: character.maxHp,
    mana: character.mana,
    maxMana: character.maxMana,
    gold: character.gold,
    inventory: safeArray(character.inventory).map(item => ({ ...item })),
    equippedItems: safeArray(character.equippedItems),
    statusEffects: safeArray(character.statusEffects),
    worldLedger: safeObject(session.worldLedger),
    missionLog: safeObject(session.missionLog),
    combatState: session.combatState ? { ...session.combatState } : null,
    turnCount: session.turnCount,
    isGameOver: Boolean(session.isGameOver)
  };
}

/**
 * Advance story state using centralized GameStateEngine with atomic transaction
 */
async function advanceStoryState({ session, character, currentNode, chosenChoice, nextScene, transaction }) {
  const stateUpdates = nextScene.stateUpdates || {};

  // 1. Resolve State Mutators deterministically
  let validatedUpdates;
  if (gameStateEngine?.resolveAction) {
    const result = gameStateEngine.resolveAction(session, character, currentNode, chosenChoice, stateUpdates);
    validatedUpdates = result.validatedUpdates;
  } else {
    // Pure server-side deterministic resolution fallback
    const rawHpChange = Number(stateUpdates.proposedHpChange ?? stateUpdates.hpChange ?? 0);
    const rawManaChange = Number(stateUpdates.proposedManaChange ?? stateUpdates.manaChange ?? 0);
    const rawGoldChange = Number(stateUpdates.proposedGoldChange ?? stateUpdates.goldChange ?? 0);

    // Hazard protection: Check dangerous lethal keywords if LLM gave 0 damage
    const lethalWords = ['lahar', 'magma', 'kawah', 'racun maut', 'jurang', 'bunuh diri'];
    const defensiveWords = ['hindar', 'menghindar', 'jauh', 'menjauh', 'waspada', 'hati-hati', 'lindung', 'bertahan'];
    const actTextLower = (chosenChoice?.text || '').toLowerCase();
    const isDefensive = defensiveWords.some(dw => actTextLower.includes(dw));
    let adjustedHpChange = rawHpChange;
    if (!isDefensive && lethalWords.some(w => actTextLower.includes(w)) && rawHpChange >= 0) {
      adjustedHpChange = -25;
    }

    validatedUpdates = {
      hpChange: adjustedHpChange,
      manaChange: rawManaChange,
      goldChange: rawGoldChange,
      receivedItem: stateUpdates.receivedItem || (stateUpdates.receivedItemId ? resolveItemData(stateUpdates.receivedItemId) : null),
      consumedItem: stateUpdates.consumedItem || stateUpdates.consumedItemId || chosenChoice?.requiredItem || null
    };
  }

  // 2. Apply clamped vitals
  character.hp = Math.max(0, Math.min(character.maxHp, character.hp + (validatedUpdates.hpChange || 0)));
  character.mana = Math.max(0, Math.min(character.maxMana, character.mana + (validatedUpdates.manaChange || 0)));
  character.gold = Math.max(0, character.gold + (validatedUpdates.goldChange || 0));

  // 3. Process inventory mutations
  let currentInv = safeArray(character.inventory);
  if (validatedUpdates.consumedItem) {
    const target = String(validatedUpdates.consumedItem).toLowerCase();
    const idx = currentInv.findIndex(i =>
      i && (
        String(i.id).toLowerCase() === target ||
        String(i.name).toLowerCase() === target ||
        String(i.name).toLowerCase().includes(target)
      )
    );
    if (idx !== -1) {
      currentInv.splice(idx, 1);
    }
  }

  if (validatedUpdates.receivedItem) {
    const itemToAdd = typeof validatedUpdates.receivedItem === 'object'
      ? validatedUpdates.receivedItem
      : resolveItemData(validatedUpdates.receivedItem);

    if (itemToAdd) {
      if (currentInv.length < 6) {
        currentInv.push(itemToAdd);
      } else {
        const dropNote = `Tas inventaris penuh (maks 6). ${itemToAdd.name || 'Barang baru'} tidak dapat disimpan!`;
        nextScene.consequenceNote = nextScene.consequenceNote ? `${nextScene.consequenceNote} (${dropNote})` : dropNote;
      }
    }
  }
  character.inventory = currentInv;
  await character.save({ transaction });

  // 4. Update World Ledger
  let ledger = safeObject(session.worldLedger);
  if (worldLedgerService?.addFact && stateUpdates.factDiscovered) {
    ledger = worldLedgerService.addFact(ledger, {
      id: `fact_${Date.now()}`,
      type: 'DISCOVERY',
      target: stateUpdates.factDiscovered,
      turn: session.turnCount + 1,
      timestamp: new Date().toISOString()
    });
  } else {
    if (!ledger.questFlags || typeof ledger.questFlags !== 'object') ledger.questFlags = {};
    if (!ledger.reputation || typeof ledger.reputation !== 'object') ledger.reputation = {};
    if (stateUpdates.addLedgerFact || stateUpdates.factDiscovered) {
      ledger.questFlags[`turn_${session.turnCount + 1}`] = stateUpdates.addLedgerFact || stateUpdates.factDiscovered;
    }
    if (stateUpdates.reputationChange && typeof stateUpdates.reputationChange === 'object') {
      for (const [faction, delta] of Object.entries(stateUpdates.reputationChange)) {
        ledger.reputation[faction] = (ledger.reputation[faction] || 0) + Number(delta);
      }
    }
  }
  session.worldLedger = ledger;
  session.turnCount += 1;

  // 5. Evaluate Quest & Ending Conditions (NO hardcoded turnCount >= 11 forced victory!)
  let isQuestComplete = false;
  if (questEngine?.evaluateObjectives) {
    const evalResult = questEngine.evaluateObjectives(session, session.Campaign, ledger, { chosenChoice });
    isQuestComplete = evalResult.isCompleted || false;
  } else {
    // Only complete if explicit quest flag or finale choice taken
    isQuestComplete = Boolean(ledger.questFlags?.main_quest_completed || chosenChoice?.id === 'finish_game');
  }

  if (character.hp <= 0) {
    session.isGameOver = true;
  } else if (isQuestComplete || chosenChoice?.id === 'finish_game') {
    session.isGameOver = true;
  }

  // 6. Resolve background ID
  const campaignBg = session.Campaign?.defaultBackgroundId;
  const currentBg = currentNode?.backgroundId;
  const candidateBg = nextScene?.backgroundId;
  let resolvedBg = candidateBg;
  if (!resolvedBg || (resolvedBg === 'bg_01_tavern' && campaignBg && campaignBg !== 'bg_01_tavern')) {
    resolvedBg = currentBg || campaignBg || 'bg_01_tavern';
  }

  // 7. Create next node with full snapshot
  const snapshot = createGameStateSnapshot(character, session, currentNode);

  const newNode = await StoryNode.create({
    sessionId: session.id,
    parentNodeId: currentNode.id,
    chapterTitle: nextScene.chapterTitle || `Babak ${session.turnCount}: Petualangan Berlanjut`,
    location: nextScene.location || 'Aetheria',
    backgroundId: resolvedBg,
    speaker: nextScene.speaker || 'Dungeon Master',
    characterId: nextScene.characterId || null,
    mood: nextScene.mood || 'neutral',
    dialogueText: nextScene.dialogue,
    consequenceNote: nextScene.consequenceNote,
    choices: safeArray(nextScene.choices),
    combatEncounter: nextScene.combatEncounter || null,
    characterSnapshot: snapshot,
    gameStateSnapshot: snapshot
  }, { transaction });

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
      warrior: { hp: 35, maxHp: 35, mana: 15, maxMana: 15, str: 16, dex: 12, con: 15, int: 9, wis: 10, cha: 11, avatar: 'char_hero_01_paladin' },
      rogue: { hp: 28, maxHp: 28, mana: 18, maxMana: 18, str: 10, dex: 16, con: 12, int: 13, wis: 12, cha: 14, avatar: 'char_hero_05_rogue' },
      mage: { hp: 24, maxHp: 24, mana: 35, maxMana: 35, str: 8, dex: 13, con: 11, int: 17, wis: 14, cha: 10, avatar: 'char_hero_03_wizard' },
      cleric: { hp: 30, maxHp: 30, mana: 25, maxMana: 25, str: 13, dex: 10, con: 14, int: 10, wis: 16, cha: 13, avatar: 'char_hero_06_cleric' },
      ranger: { hp: 28, maxHp: 28, mana: 20, maxMana: 20, str: 11, dex: 17, con: 13, int: 12, wis: 15, cha: 10, avatar: 'char_hero_02_ranger' },
      warlock: { hp: 26, maxHp: 26, mana: 30, maxMana: 30, str: 9, dex: 14, con: 12, int: 14, wis: 11, cha: 17, avatar: 'char_hero_07_warlock' },
      barbarian: { hp: 38, maxHp: 38, mana: 10, maxMana: 10, str: 17, dex: 13, con: 16, int: 8, wis: 11, cha: 9, avatar: 'char_hero_04_dwarf' },
      dragonborn: { hp: 36, maxHp: 36, mana: 12, maxMana: 12, str: 17, dex: 11, con: 15, int: 10, wis: 10, cha: 13, avatar: 'char_hero_08_dragonborn' },
      bard: { hp: 26, maxHp: 26, mana: 24, maxMana: 24, str: 10, dex: 14, con: 12, int: 12, wis: 12, cha: 17, avatar: 'char_hero_09_bard' }
    };

    const chosenClass = (characterData?.characterClass || 'warrior').toLowerCase();
    const preset = classPresets[chosenClass] || classPresets.warrior;

    const initialInventory = [
      {
        id: 'item_01_potion_heal',
        name: 'Potion of Healing',
        category: 'consumable',
        effect: 'Memulihkan 25 HP',
        icon: 'item_01_potion_heal'
      }
    ];

    if (characterData?.starterItem) {
      initialInventory.push(characterData.starterItem);
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

    const session = await GameSession.create({
      campaignId: campaign.id,
      characterId: character.id,
      turnCount: 1,
      worldLedger: {
        questFlags: { started: true },
        reputation: {}
      },
      isGameOver: false
    }, { transaction });

    const openingScene = await geminiService.generateOpeningScene(campaign, character);

    session.missionLog = openingScene.missionLog || {
      title: `Jurnal Misi: ${campaign.title}`,
      prologue: `${campaign.premise || 'Sebuah krisis menuntut penyelidikan mendalam.'}\n\nKehadiran ${character.name} sang ${character.characterClass} diharapkan dapat menuntaskan persoalan ini sebelum dampaknya meluas.`,
      targetGoal: `Selesaikan investigasi dan netralkan sumber krisis.`
    };

    if (openingScene.stateUpdates?.receivedItem) {
      const inv = safeArray(character.inventory);
      if (inv.length < 6) {
        inv.push(openingScene.stateUpdates.receivedItem);
        character.inventory = inv;
        await character.save({ transaction });
      }
    }

    const startingBgId = (openingScene.backgroundId && openingScene.backgroundId !== 'bg_01_tavern')
      ? openingScene.backgroundId
      : (campaign.defaultBackgroundId || 'bg_01_tavern');

    const initialSnapshot = createGameStateSnapshot(character, session, null);

    const rootNode = await StoryNode.create({
      sessionId: session.id,
      parentNodeId: null,
      chapterTitle: openingScene.chapterTitle || 'Babak I: Panggilan Takdir',
      location: openingScene.location || 'Aetheria',
      backgroundId: startingBgId,
      speaker: openingScene.speaker || 'Dungeon Master',
      characterId: openingScene.characterId || null,
      mood: openingScene.mood || 'neutral',
      dialogueText: openingScene.dialogue,
      consequenceNote: openingScene.consequenceNote,
      choices: safeArray(openingScene.choices),
      combatEncounter: openingScene.combatEncounter || null,
      characterSnapshot: initialSnapshot,
      gameStateSnapshot: initialSnapshot
    }, { transaction });

    session.currentSceneId = rootNode.id;
    await session.save({ transaction });
    await transaction.commit();

    logger.info('Game session started successfully', {
      sessionId: session.id,
      characterId: character.id,
      campaignId: campaign.id
    });

    res.json({
      success: true,
      data: {
        session,
        character,
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

exports.useItem = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { sessionId, itemId } = req.body;
    if (!sessionId || !itemId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'sessionId dan itemId wajib disertakan.' });
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
    const inv = safeArray(character.inventory);
    const itemIdx = inv.findIndex(i => i && (i.id === itemId || i.name === itemId));

    if (itemIdx === -1) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Item tidak ditemukan di dalam inventaris.' });
    }

    const item = inv[itemIdx];
    const itemData = resolveItemData(item.id || item.name) || item;

    // Apply consumable effect
    let healHp = 0;
    let healMana = 0;
    let msg = '';

    if (itemMaster?.applyItem) {
      const effectResult = itemMaster.applyItem(character, itemData.id);
      healHp = effectResult.hpRestored || 0;
      healMana = effectResult.manaRestored || 0;
      msg = effectResult.message;
    } else {
      if (itemData.effect?.hp !== undefined || itemData.effect?.mana !== undefined) {
        healHp = Number(itemData.effect.hp || 0);
        healMana = Number(itemData.effect.mana || 0);
      } else {
        // Fallback default heal
        healHp = 25;
      }
      character.hp = Math.min(character.maxHp, character.hp + healHp);
      character.mana = Math.min(character.maxMana, character.mana + healMana);
      msg = `Memulihkan ${healHp ? `${healHp} HP` : ''}${healHp && healMana ? ' & ' : ''}${healMana ? `${healMana} Mana` : ''} dari ${item.name}!`;
    }

    // Remove consumed item
    inv.splice(itemIdx, 1);
    character.inventory = inv;
    await character.save({ transaction });
    await transaction.commit();

    logger.info('Player used item', {
      sessionId,
      characterId: character.id,
      itemId,
      healHp,
      healMana,
      currentHp: character.hp
    });

    return res.json({
      success: true,
      message: msg,
      data: { character }
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('useItem Error', err);
    res.status(500).json({ success: false, error: 'Internal server error saat menggunakan item.' });
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

    const currentNode = await StoryNode.findByPk(session.currentSceneId, { transaction });
    if (!currentNode) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Node cerita aktif tidak ditemukan.' });
    }

    const character = session.Character;
    const hpBefore = character.hp;

    // Direct game resolution if finish_game is explicitly selected
    if (choiceId === 'finish_game') {
      session.isGameOver = true;
      await session.save({ transaction });
      await transaction.commit();
      return res.json({
        success: true,
        data: {
          session,
          character,
          currentNode,
          checkResult: null
        }
      });
    }

    const chosenChoice = resolveChoice(currentNode, choiceId, customText, tone);
    const recentHistory = await getRecentStoryHistory(session.id, currentNode.id, 4);

    // Call narrative generation
    const nextScene = await geminiService.generateNextScene({
      session,
      character,
      previousNode: currentNode,
      actionTaken: chosenChoice,
      recentHistory,
      worldLedger: session.worldLedger
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

    // Structured logging of turn
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
        character,
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

/**
 * Server-Side Tactical Combat Action Endpoint
 * Strictly rejects phantom encounters (HTTP 400).
 * Calculates turns, damage, accuracy, and life cycles entirely on server.
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

    // If victory achieved, clean active combatEncounter on current node to avoid replay
    if (combatResult.isVictory && currentNode) {
      currentNode.combatEncounter = null;
      await currentNode.save({ transaction });
    }

    await character.save({ transaction });
    await session.save({ transaction });
    await transaction.commit();

    // Structured logging
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

    return res.json({
      success: true,
      message: combatResult.actionLog,
      data: {
        session,
        character,
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
      transaction
    });
    if (!targetNode) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Node target tidak valid untuk sesi ini.' });
    }

    session.currentSceneId = targetNode.id;
    session.isGameOver = false;

    // Use gameStateEngine.restoreSnapshot if available
    if (gameStateEngine?.restoreSnapshot) {
      await gameStateEngine.restoreSnapshot(targetNode, session, session.Character, transaction);
    } else {
      // Snapshot restoration from gameStateSnapshot or characterSnapshot
      const snap = targetNode.gameStateSnapshot || targetNode.characterSnapshot;
      if (snap && session.Character) {
        session.turnCount = snap.turnCount || session.turnCount;
        if (snap.hp !== undefined) session.Character.hp = snap.hp;
        if (snap.maxHp !== undefined) session.Character.maxHp = snap.maxHp;
        if (snap.mana !== undefined) session.Character.mana = snap.mana;
        if (snap.maxMana !== undefined) session.Character.maxMana = snap.maxMana;
        if (snap.gold !== undefined) session.Character.gold = snap.gold;
        if (snap.inventory) session.Character.inventory = safeArray(snap.inventory);
        if (snap.worldLedger) session.worldLedger = snap.worldLedger;
        if (snap.combatState !== undefined) session.combatState = snap.combatState;

        await session.Character.save({ transaction });
      }
    }

    await session.save({ transaction });
    await transaction.commit();

    logger.info('Session rewound successfully', {
      sessionId,
      targetNodeId,
      turnCount: session.turnCount,
      restoredHp: session.Character?.hp
    });

    res.json({
      success: true,
      data: {
        session,
        character: session.Character,
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
    const nodes = await StoryNode.findAll({
      where: { sessionId },
      order: [['createdAt', 'ASC']]
    });
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

    const nodes = await StoryNode.findAll({ where: { sessionId } });
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

    const currentNode = await StoryNode.findByPk(session.currentSceneId, { transaction });
    if (!currentNode) {
      await transaction.rollback();
      res.write(`data: ${JSON.stringify({ error: 'Node cerita aktif tidak ditemukan' })}\n\n`);
      return res.end();
    }

    const character = session.Character;

    if (choiceId === 'finish_game') {
      session.isGameOver = true;
      await session.save({ transaction });
      await transaction.commit();
      res.write(`data: ${JSON.stringify({
        type: 'done',
        data: { session, character, currentNode, checkResult: null }
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
      worldLedger: session.worldLedger
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

    res.write(`data: ${JSON.stringify({
      type: 'done',
      data: {
        session,
        character,
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

exports.getGameSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan.' });
    }

    const allNodes = await StoryNode.findAll({
      where: { sessionId },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'parentNodeId', 'chapterTitle', 'location', 'speaker', 'mood', 'consequenceNote', 'createdAt']
    });

    const nodeMap = new Map(allNodes.map(n => [n.id, n]));
    const chain = [];
    let curr = nodeMap.get(session.currentSceneId);
    while (curr) {
      chain.unshift(curr);
      curr = curr.parentNodeId ? nodeMap.get(curr.parentNodeId) : null;
    }
    const finalNodes = chain.length > 0 ? chain : allNodes;

    const character = session.Character;
    const campaign = session.Campaign;
    const ledgerFacts = Object.entries(session.worldLedger?.questFlags || {}).map(([turn, fact]) => ({
      turn,
      fact
    }));

    res.json({
      success: true,
      data: {
        campaignTitle: campaign?.title || 'Petualangan Aether',
        characterName: character?.name || 'Pahlawan',
        characterClass: character?.characterClass || 'Petualang',
        totalStages: finalNodes.length,
        isVictory: character ? character.hp > 0 : false,
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
        milestones: ledgerFacts
      }
    });
  } catch (err) {
    logger.error('getGameSummary Error', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
