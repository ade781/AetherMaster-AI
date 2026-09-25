const { Character, Campaign, GameSession, StoryNode } = require('../models');
const geminiService = require('../services/geminiService');

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({ order: [['id', 'ASC']] });
    res.json({ success: true, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.startCampaign = async (req, res) => {
  try {
    const { campaignId, characterData } = req.body;
    const campaign = await Campaign.findByPk(campaignId || 'whispering_tavern');
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Kampanye tidak ditemukan.' });
    }

    // Default class stats
    const classPresets = {
      warrior: { hp: 35, maxHp: 35, mana: 15, maxMana: 15, str: 16, dex: 12, con: 15, int: 9, wis: 10, cha: 11, avatar: 'char_hero_01_paladin' },
      rogue: { hp: 28, maxHp: 28, mana: 18, maxMana: 18, str: 10, dex: 16, con: 12, int: 13, wis: 12, cha: 14, avatar: 'char_hero_05_rogue' },
      mage: { hp: 24, maxHp: 24, mana: 35, maxMana: 35, str: 8, dex: 13, con: 11, int: 17, wis: 14, cha: 10, avatar: 'char_hero_03_wizard' },
      cleric: { hp: 30, maxHp: 30, mana: 25, maxMana: 25, str: 13, dex: 10, con: 14, int: 10, wis: 16, cha: 13, avatar: 'char_hero_06_cleric' },
      ranger: { hp: 28, maxHp: 28, mana: 20, maxMana: 20, str: 11, dex: 17, con: 13, int: 12, wis: 15, cha: 10, avatar: 'char_hero_02_ranger' },
      warlock: { hp: 26, maxHp: 26, mana: 30, maxMana: 30, str: 9, dex: 14, con: 12, int: 14, wis: 11, cha: 17, avatar: 'char_hero_07_warlock' }
    };

    const chosenClass = (characterData?.characterClass || 'warrior').toLowerCase();
    const preset = classPresets[chosenClass] || classPresets.warrior;

    const initialInventory = [
      {
        id: 'item_01_potion_heal',
        name: 'Potion of Healing',
        category: 'Obat',
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
    });

    const session = await GameSession.create({
      campaignId: campaign.id,
      characterId: character.id,
      turnCount: 1,
      worldLedger: {
        questFlags: { started: true },
        reputation: {}
      },
      isGameOver: false
    });

    // Generate initial scene
    const openingScene = await geminiService.generateOpeningScene(campaign, character);

    // Apply any initial state updates
    if (openingScene.stateUpdates?.receivedItem) {
      const inv = [...character.inventory];
      if (inv.length < 6) {
        inv.push(openingScene.stateUpdates.receivedItem);
        character.inventory = inv;
        await character.save();
      }
    }

    const rootNode = await StoryNode.create({
      sessionId: session.id,
      parentNodeId: null,
      chapterTitle: openingScene.chapterTitle,
      location: openingScene.location,
      backgroundId: openingScene.backgroundId,
      speaker: openingScene.speaker,
      characterId: openingScene.characterId,
      mood: openingScene.mood,
      dialogueText: openingScene.dialogue,
      consequenceNote: openingScene.consequenceNote,
      choices: openingScene.choices,
      combatEncounter: openingScene.combatEncounter || null,
      characterSnapshot: {
        hp: character.hp,
        maxHp: character.maxHp,
        mana: character.mana,
        maxMana: character.maxMana,
        gold: character.gold,
        inventory: [...character.inventory],
        turnCount: session.turnCount
      }
    });

    session.currentSceneId = rootNode.id;
    await session.save();

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
    console.error('startCampaign Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Use consumable item from HUD inventory with persistent database save
exports.useItem = async (req, res) => {
  try {
    const { sessionId, itemId } = req.body;
    const session = await GameSession.findByPk(sessionId, {
      include: [Character]
    });
    if (!session || !session.Character) {
      return res.status(404).json({ success: false, error: 'Sesi atau karakter tidak ditemukan.' });
    }

    const character = session.Character;
    const inv = [...(character.inventory || [])];
    const itemIdx = inv.findIndex(i => i.id === itemId || i.name === itemId);

    if (itemIdx === -1) {
      return res.status(400).json({ success: false, error: 'Item tidak ditemukan di dalam inventaris.' });
    }

    const item = inv[itemIdx];
    let msg = '';

    if (item.category === 'Obat' || item.category === 'Potion' || item.id.includes('potion')) {
      const lowerName = item.name.toLowerCase();
      const lowerEff = (item.effect || '').toLowerCase();

      if (lowerName.includes('mana') || lowerEff.includes('mana')) {
        const healAmt = 25;
        character.mana = Math.min(character.maxMana, character.mana + healAmt);
        msg = `Memulihkan ${healAmt} Mana dari ${item.name}!`;
      } else {
        const healAmt = 25;
        character.hp = Math.min(character.maxHp, character.hp + healAmt);
        msg = `Memulihkan ${healAmt} HP dari ${item.name}!`;
      }

      // Consume item from inventory
      inv.splice(itemIdx, 1);
      character.inventory = inv;
      await character.save();

      return res.json({
        success: true,
        message: msg,
        data: { character }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `${item.name} tidak bisa dikonsumsi langsung. Gunakan melalui dialog/pilihan cerita!`
      });
    }
  } catch (err) {
    console.error('useItem Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.submitAction = async (req, res) => {
  try {
    const { sessionId, choiceId, statType, dc, advantage, disadvantage } = req.body;

    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    const currentNode = await StoryNode.findByPk(session.currentSceneId);
    if (!currentNode) {
      return res.status(404).json({ success: false, error: 'Node cerita aktif tidak ditemukan.' });
    }

    const character = session.Character;
    const choiceList = currentNode.choices || [];
    const chosenChoice = choiceList.find(c => c.id === choiceId) || {
      id: choiceId || 'custom',
      text: req.body.customText || 'Melangkah maju dengan waspada',
      statType: statType || 'STR',
      dc: dc || 12,
      tone: req.body.tone || 'kreatif'
    };

    const diceEngine = require('../utils/diceEngine');
    const { getEffectiveStats } = require('../utils/statEngine');
    const effectiveChar = getEffectiveStats(character);

    // D&D 5E Dice Check resolution
    const checkStat = statType || chosenChoice.statType || 'STR';
    const checkDc = typeof dc === 'number' ? dc : (typeof chosenChoice.dc === 'number' ? chosenChoice.dc : 10);
    const checkResult = diceEngine.performCheck({
      character: effectiveChar,
      statType: checkStat,
      dc: checkDc,
      advantage: Boolean(advantage),
      disadvantage: Boolean(disadvantage)
    });

    // Generate next scene with check result passed in
    const nextScene = await geminiService.generateNextScene({
      session,
      character,
      previousNode: currentNode,
      actionTaken: chosenChoice,
      checkResult
    });

    // Apply state updates to character (HP, Mana, Gold)
    const stateUpdates = nextScene.stateUpdates || {};

    // Hazard enforcement: if player deliberately dove into fatal hazards and LLM was too lenient
    const lethalWords = ['lahar', 'magma', 'kawah', 'racun maut', 'jurang', 'bunuh diri', 'tanpa perlindungan'];
    const actTextLower = (chosenChoice.text || '').toLowerCase();
    if (lethalWords.some(w => actTextLower.includes(w)) && (!stateUpdates.hpChange || stateUpdates.hpChange >= 0)) {
      stateUpdates.hpChange = -25;
    }

    let newHp = character.hp + (stateUpdates.hpChange || 0);
    newHp = Math.max(0, Math.min(character.maxHp, newHp));
    character.hp = newHp;

    let newMana = character.mana + (stateUpdates.manaChange || 0);
    newMana = Math.max(0, Math.min(character.maxMana, newMana));
    character.mana = newMana;

    let newGold = character.gold + (stateUpdates.goldChange || 0);
    character.gold = Math.max(0, newGold);

    // Process inventory: consumption and receiving
    let currentInv = [...(character.inventory || [])];
    const toConsume = stateUpdates.consumedItem || (chosenChoice.requiredItem ? chosenChoice.requiredItem : null);
    if (toConsume) {
      const lowerReq = String(toConsume).toLowerCase();
      const idx = currentInv.findIndex(i => 
        i.id === toConsume || 
        i.name.toLowerCase() === lowerReq || 
        i.name.toLowerCase().includes(lowerReq) ||
        lowerReq.includes(i.name.toLowerCase())
      );
      if (idx !== -1 && (currentInv[idx].category === 'Kunci' || currentInv[idx].category === 'Obat' || currentInv[idx].category === 'Potion')) {
        currentInv.splice(idx, 1);
      }
    }

    if (stateUpdates.receivedItem && currentInv.length < 6) {
      currentInv.push(stateUpdates.receivedItem);
    }
    character.inventory = currentInv;
    await character.save();

    // Update world ledger (quest flags & persistent faction reputation)
    const ledger = session.worldLedger || { questFlags: {}, reputation: {} };
    if (!ledger.reputation) ledger.reputation = {};
    if (!ledger.questFlags) ledger.questFlags = {};
    if (stateUpdates.addLedgerFact) {
      ledger.questFlags[`turn_${session.turnCount + 1}`] = stateUpdates.addLedgerFact;
    }
    if (stateUpdates.reputation && typeof stateUpdates.reputation === 'object') {
      for (const [faction, delta] of Object.entries(stateUpdates.reputation)) {
        ledger.reputation[faction] = (ledger.reputation[faction] || 0) + Number(delta);
      }
    }
    session.worldLedger = ledger;
    session.turnCount += 1;
    if (newHp <= 0) {
      session.isGameOver = true;
    }

    // Create next node with character state snapshot for precise rewind
    const newNode = await StoryNode.create({
      sessionId: session.id,
      parentNodeId: currentNode.id,
      chapterTitle: nextScene.chapterTitle,
      location: nextScene.location,
      backgroundId: nextScene.backgroundId,
      speaker: nextScene.speaker,
      characterId: nextScene.characterId,
      mood: nextScene.mood,
      dialogueText: nextScene.dialogue,
      consequenceNote: nextScene.consequenceNote,
      choices: nextScene.choices,
      combatEncounter: nextScene.combatEncounter || null,
      characterSnapshot: {
        hp: character.hp,
        maxHp: character.maxHp,
        mana: character.mana,
        maxMana: character.maxMana,
        gold: character.gold,
        inventory: [...character.inventory],
        turnCount: session.turnCount
      }
    });

    session.currentSceneId = newNode.id;
    await session.save();

    res.json({
      success: true,
      data: {
        session,
        character,
        currentNode: newNode,
        checkResult
      }
    });
  } catch (err) {
    console.error('submitAction Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.rewindToNode = async (req, res) => {
  try {
    const { sessionId, targetNodeId } = req.body;
    const session = await GameSession.findByPk(sessionId, {
      include: [Character]
    });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan.' });
    }

    const targetNode = await StoryNode.findOne({
      where: { id: targetNodeId, sessionId }
    });
    if (!targetNode) {
      return res.status(404).json({ success: false, error: 'Node target tidak valid untuk sesi ini.' });
    }

    session.currentSceneId = targetNode.id;
    session.isGameOver = false;

    // Restore character snapshot if available for true state rewind
    if (targetNode.characterSnapshot && session.Character) {
      const snap = targetNode.characterSnapshot;
      session.turnCount = snap.turnCount || 1;
      session.Character.hp = snap.hp !== undefined ? snap.hp : session.Character.hp;
      session.Character.maxHp = snap.maxHp !== undefined ? snap.maxHp : session.Character.maxHp;
      session.Character.mana = snap.mana !== undefined ? snap.mana : session.Character.mana;
      session.Character.maxMana = snap.maxMana !== undefined ? snap.maxMana : session.Character.maxMana;
      session.Character.gold = snap.gold !== undefined ? snap.gold : session.Character.gold;
      session.Character.inventory = snap.inventory ? [...snap.inventory] : session.Character.inventory;
      
      // If was defeated, revive with half HP
      if (session.Character.hp <= 0) {
        session.Character.hp = Math.floor(session.Character.maxHp / 2);
      }
      await session.Character.save();
    } else if (session.Character && session.Character.hp <= 0) {
      session.Character.hp = Math.floor(session.Character.maxHp / 2);
      await session.Character.save();
    }

    await session.save();

    res.json({
      success: true,
      data: {
        session,
        character: session.Character,
        currentNode: targetNode
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
};

// Tactical Turn-Based Combat Engine (Pilar 3.3 Mini-VTT)
exports.combatAction = async (req, res) => {
  try {
    const { sessionId, action, itemId } = req.body;
    const session = await GameSession.findByPk(sessionId, {
      include: [Character]
    });
    if (!session || !session.Character) {
      return res.status(404).json({ success: false, error: 'Sesi atau karakter tidak ditemukan.' });
    }

    const character = session.Character;
    const currentNode = await StoryNode.findByPk(session.currentSceneId);
    const diceEngine = require('../utils/diceEngine');
    const { getEffectiveStats } = require('../utils/statEngine');
    const effectiveChar = getEffectiveStats(character);

    // Initialize or load combatState
    let combatState = session.combatState;
    if (!combatState || !combatState.inCombat) {
      const enc = currentNode?.combatEncounter || {};
      combatState = {
        inCombat: true,
        round: 1,
        enemy: {
          id: enc.enemyId || 'enemy_boss',
          name: enc.enemyName || 'Prajurit Kerangka Kuno',
          hp: enc.enemyHp || 25,
          maxHp: enc.maxEnemyHp || 25,
          ac: enc.enemyAc || 12,
          attackBonus: enc.attackBonus || 3,
          damageDice: enc.damageDice || 6,
          damageBonus: enc.damageBonus || 2
        },
        combatLog: []
      };
    }

    const upperAction = (action || 'ATTACK').toUpperCase();
    let actionLog = '';

    if (upperAction === 'ATTACK') {
      const charMod = effectiveChar.modifiers.str;
      const attackBonus = charMod + (character.level || 1);
      const attackRes = diceEngine.performCombatAttack({
        attackerName: character.name,
        targetName: combatState.enemy.name,
        attackBonus,
        targetAC: combatState.enemy.ac,
        damageDice: 8,
        damageBonus: Math.max(0, charMod)
      });
      if (attackRes.isHit) {
        combatState.enemy.hp = Math.max(0, combatState.enemy.hp - attackRes.damageDealt);
      }
      combatState.combatLog.push(attackRes.log);
      actionLog = attackRes.log;

    } else if (upperAction === 'CAST_SPELL') {
      if (character.mana < 5) {
        return res.status(400).json({ success: false, error: 'Mana tidak mencukupi untuk merapal sihir (butuh min. 5 Mana)!' });
      }
      character.mana = Math.max(0, character.mana - 5);
      const spellMod = Math.max(effectiveChar.modifiers.int, effectiveChar.modifiers.wis, effectiveChar.modifiers.cha);
      const attackBonus = spellMod + (character.level || 1);
      const spellRes = diceEngine.performCombatAttack({
        attackerName: `${character.name} (Sihir)`,
        targetName: combatState.enemy.name,
        attackBonus,
        targetAC: combatState.enemy.ac,
        damageDice: 10,
        damageBonus: Math.max(0, spellMod)
      });
      if (spellRes.isHit) {
        combatState.enemy.hp = Math.max(0, combatState.enemy.hp - spellRes.damageDealt);
      }
      combatState.combatLog.push(spellRes.log);
      actionLog = spellRes.log;

    } else if (upperAction === 'USE_ITEM') {
      const inv = [...(character.inventory || [])];
      const itemIdx = inv.findIndex(i => i.id === itemId || i.name === itemId || i.id.includes('potion'));
      if (itemIdx === -1) {
        return res.status(400).json({ success: false, error: 'Item obat tidak ditemukan dalam inventaris.' });
      }
      const item = inv[itemIdx];
      character.hp = Math.min(character.maxHp, character.hp + 25);
      inv.splice(itemIdx, 1);
      character.inventory = inv;
      const useLog = `${character.name} menggunakan ${item.name} dan memulihkan 25 HP!`;
      combatState.combatLog.push(useLog);
      actionLog = useLog;

    } else if (upperAction === 'FLEE') {
      const fleeCheck = diceEngine.performCheck({
        character: effectiveChar,
        statType: 'DEX',
        dc: 12
      });
      if (fleeCheck.isSuccess) {
        combatState.inCombat = false;
        const fleeLog = `${character.name} berhasil melarikan diri dari medan tempur (DEX Roll ${fleeCheck.total} vs DC 12)!`;
        combatState.combatLog.push(fleeLog);
        session.combatState = combatState;
        await session.save();
        await character.save();
        return res.json({
          success: true,
          message: fleeLog,
          data: {
            session,
            character,
            combatState,
            actionLog: fleeLog
          }
        });
      } else {
        const failLog = `${character.name} gagal melarikan diri dari sergapan musuh!`;
        combatState.combatLog.push(failLog);
        actionLog = failLog;
      }
    }

    // Check if enemy is defeated
    if (combatState.enemy.hp <= 0) {
      combatState.inCombat = false;
      const winLog = `Kemenangan! ${combatState.enemy.name} telah dikalahkan. Kamu memperoleh 25 Koin Emas!`;
      combatState.combatLog.push(winLog);
      character.gold += 25;
    } else if (combatState.inCombat) {
      // Monster counter-attack turn
      const enemyAttack = diceEngine.performCombatAttack({
        attackerName: combatState.enemy.name,
        targetName: character.name,
        attackBonus: combatState.enemy.attackBonus,
        targetAC: effectiveChar.armorClass,
        damageDice: combatState.enemy.damageDice,
        damageBonus: combatState.enemy.damageBonus
      });
      if (enemyAttack.isHit) {
        character.hp = Math.max(0, character.hp - enemyAttack.damageDealt);
        if (character.hp <= 0) {
          session.isGameOver = true;
        }
      }
      combatState.combatLog.push(enemyAttack.log);
      combatState.round += 1;
    }

    session.combatState = combatState;
    await character.save();
    await session.save();

    return res.json({
      success: true,
      message: actionLog,
      data: {
        session,
        character,
        combatState,
        isGameOver: session.isGameOver,
        actionLog
      }
    });
  } catch (err) {
    console.error('combatAction Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Server-Sent Events (SSE) Streaming for Narrative Delivery (Fase 6)
exports.actionStream = async (req, res) => {
  const sessionId = req.body?.sessionId || req.query?.sessionId;
  const choiceId = req.body?.choiceId || req.query?.choiceId;
  const customText = req.body?.customText || req.query?.customText;
  const statType = req.body?.statType || req.query?.statType;
  const dc = req.body?.dc || req.query?.dc;

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'sessionId wajib disertakan.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const session = await GameSession.findByPk(sessionId, { include: [Character, Campaign] });
    if (!session) {
      res.write(`data: ${JSON.stringify({ error: 'Sesi tidak ditemukan' })}\n\n`);
      return res.end();
    }

    const currentNode = await StoryNode.findByPk(session.currentSceneId);
    if (!currentNode) {
      res.write(`data: ${JSON.stringify({ error: 'Node cerita aktif tidak ditemukan' })}\n\n`);
      return res.end();
    }

    const character = session.Character;
    const choiceList = currentNode.choices || [];
    const chosenChoice = choiceList.find(c => c.id === choiceId) || {
      id: choiceId || 'custom',
      text: customText || 'Melangkah maju dengan waspada',
      statType: statType || 'STR',
      dc: dc ? Number(dc) : 12,
      tone: 'kreatif'
    };

    const diceEngine = require('../utils/diceEngine');
    const { getEffectiveStats } = require('../utils/statEngine');
    const effectiveChar = getEffectiveStats(character);

    const checkStat = statType || chosenChoice.statType || 'STR';
    const checkDc = typeof dc === 'number' ? Number(dc) : (typeof chosenChoice.dc === 'number' ? chosenChoice.dc : 10);
    const checkResult = diceEngine.performCheck({
      character: effectiveChar,
      statType: checkStat,
      dc: checkDc
    });

    res.write(`data: ${JSON.stringify({ type: 'check', checkResult })}\n\n`);

    const nextScene = await geminiService.generateNextScene({
      session,
      character,
      previousNode: currentNode,
      actionTaken: chosenChoice,
      checkResult
    });

    // Stream the dialogue text words with small pacing
    const words = (nextScene.dialogue || '').split(' ');
    for (let i = 0; i < words.length; i++) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: (i === 0 ? '' : ' ') + words[i] })}\n\n`);
    }

    // Apply updates
    const stateUpdates = nextScene.stateUpdates || {};
    let newHp = Math.max(0, Math.min(character.maxHp, character.hp + (stateUpdates.hpChange || 0)));
    character.hp = newHp;
    character.mana = Math.max(0, Math.min(character.maxMana, character.mana + (stateUpdates.manaChange || 0)));
    character.gold = Math.max(0, character.gold + (stateUpdates.goldChange || 0));

    let currentInv = [...(character.inventory || [])];
    if (stateUpdates.receivedItem && currentInv.length < 6) {
      currentInv.push(stateUpdates.receivedItem);
    }
    character.inventory = currentInv;
    await character.save();

    const ledger = session.worldLedger || { questFlags: {}, reputation: {} };
    if (!ledger.reputation) ledger.reputation = {};
    if (!ledger.questFlags) ledger.questFlags = {};
    if (stateUpdates.addLedgerFact) {
      ledger.questFlags[`turn_${session.turnCount + 1}`] = stateUpdates.addLedgerFact;
    }
    if (stateUpdates.reputation && typeof stateUpdates.reputation === 'object') {
      for (const [faction, delta] of Object.entries(stateUpdates.reputation)) {
        ledger.reputation[faction] = (ledger.reputation[faction] || 0) + Number(delta);
      }
    }
    session.worldLedger = ledger;
    session.turnCount += 1;
    if (newHp <= 0) session.isGameOver = true;

    const newNode = await StoryNode.create({
      sessionId: session.id,
      parentNodeId: currentNode.id,
      chapterTitle: nextScene.chapterTitle,
      location: nextScene.location,
      backgroundId: nextScene.backgroundId,
      speaker: nextScene.speaker,
      characterId: nextScene.characterId,
      mood: nextScene.mood,
      dialogueText: nextScene.dialogue,
      consequenceNote: nextScene.consequenceNote,
      choices: nextScene.choices,
      combatEncounter: nextScene.combatEncounter || null,
      characterSnapshot: {
        hp: character.hp,
        maxHp: character.maxHp,
        mana: character.mana,
        maxMana: character.maxMana,
        gold: character.gold,
        inventory: [...character.inventory],
        turnCount: session.turnCount
      }
    });

    session.currentSceneId = newNode.id;
    await session.save();

    res.write(`data: ${JSON.stringify({
      type: 'done',
      data: {
        session,
        character,
        currentNode: newNode,
        checkResult
      }
    })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  }
};



