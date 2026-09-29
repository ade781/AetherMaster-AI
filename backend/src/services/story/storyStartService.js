const {
  Character,
  Campaign,
  GameSession
} = require('../../models');
const { sequelize } = require('../../config/database');
const geminiService = require('../geminiService');
const gameStateEngine = require('../../engine/gameStateEngine');
const itemMaster = require('../../engine/itemMaster');
const questEngine = require('../../engine/questEngine');
const logger = require('../../utils/logger');
const {
  ItemRepository,
  NPCRepository,
  LocationRepository,
  WorldFactRepository,
  StoryNodeRepository
} = require('../../repositories');
const { campaignsData } = require('../../models/seeders/campaignSeeder');
const { safeArray, resolveBackground } = require('./storyCommon');

class StoryStartService {
  async getCampaigns() {
    try {
      const campaigns = await Campaign.findAll({ order: [['id', 'ASC']] });
      if (campaigns && campaigns.length > 0) {
        return campaigns;
      }
      return campaignsData;
    } catch (err) {
      logger.warn('[StoryStartService.getCampaigns] Database error, falling back to static campaign data:', err.message);
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
}

module.exports = new StoryStartService();
