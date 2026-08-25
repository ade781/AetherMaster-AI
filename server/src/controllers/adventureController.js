const { Character } = require('../models');
const { generateAdventureResponse } = require('../services/aiGateway');

// @desc    Process player chat/action in adventure session
// @route   POST /api/adventure/chat
// @access  Public
exports.handleAdventureAction = async (req, res) => {
  try {
    const { characterId, characterData, story, history = [], lastAction, rollResult, apiKey } = req.body;

    let character = null;
    if (characterId && typeof characterId === 'number') {
      character = await Character.findByPk(characterId);
    } else if (characterId && typeof characterId === 'string' && !characterId.startsWith('temp_')) {
      character = await Character.findByPk(characterId);
    }

    // Use character from DB or fallback to payload/default
    const activeChar = character ? character.toJSON() : (characterData || {
      id: characterId || 1,
      name: 'Petualang Pengembara',
      race: 'Manusia',
      characterClass: 'Pendekar',
      level: 1,
      currentHp: 15,
      maxHp: 15,
      armorClass: 13,
      gold: 20,
      inventory: [],
    });

    // Call AI Dungeon Master Service
    const aiResponse = await generateAdventureResponse({
      character: activeChar,
      story: story || { title: 'Makam Kuno Eldoria', description: 'Petualangan fantasi D&D 5E' },
      history,
      lastAction,
      rollResult,
      apiKey,
    });

    // Execute Live State Mutation on Database if record exists
    let updatedHp = activeChar.currentHp;
    let updatedGold = activeChar.gold || 0;
    let updatedInventory = [...(activeChar.inventory || [])];

    if (aiResponse && aiResponse.mutation) {
      // HP Mutation (Damage / Heal)
      if (typeof aiResponse.mutation.hpChange === 'number' && aiResponse.mutation.hpChange !== 0) {
        if (aiResponse.mutation.hpChange < 0) {
          const dmg = Math.abs(aiResponse.mutation.hpChange);
          updatedHp = Math.max(0, updatedHp - dmg);
        } else {
          updatedHp = Math.min(activeChar.maxHp, updatedHp + aiResponse.mutation.hpChange);
        }
      }

      // Gold Mutation
      if (typeof aiResponse.mutation.goldChange === 'number' && aiResponse.mutation.goldChange !== 0) {
        updatedGold = Math.max(0, updatedGold + aiResponse.mutation.goldChange);
      }

      // Item Mutation
      if (aiResponse.mutation.itemGained) {
        updatedInventory.push({
          id: `item_${Date.now()}`,
          name: aiResponse.mutation.itemGained,
          type: 'item',
          desc: 'Diperoleh dari hasil eksplorasi petualangan.',
          weight: 1,
          quantity: 1,
        });
      }

      if (character) {
        await character.update({
          currentHp: updatedHp,
          gold: updatedGold,
          inventory: updatedInventory,
        });
      }
    }

    return res.json({
      success: true,
      data: {
        aiResponse,
        character: {
          id: activeChar.id,
          name: activeChar.name,
          currentHp: updatedHp,
          maxHp: activeChar.maxHp,
          gold: updatedGold,
          inventory: updatedInventory,
          armorClass: activeChar.armorClass,
        }
      }
    });
  } catch (error) {
    console.error('Adventure Action Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses narasi petualangan', error: error.message });
  }
};
