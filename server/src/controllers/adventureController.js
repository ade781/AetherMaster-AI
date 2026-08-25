const { Character } = require('../models');
const { generateAdventureResponse } = require('../services/aiGateway');

// @desc    Process player chat/action in adventure session
// @route   POST /api/adventure/chat
// @access  Public
exports.handleAdventureAction = async (req, res) => {
  try {
    const { characterId, story, history = [], lastAction, rollResult, apiKey } = req.body;

    const character = await Character.findByPk(characterId);
    if (!character) {
      return res.status(404).json({ success: false, message: 'Karakter tidak ditemukan' });
    }

    // Call AI Dungeon Master Service
    const aiResponse = await generateAdventureResponse({
      character: character.toJSON(),
      story,
      history,
      lastAction,
      rollResult,
      apiKey,
    });

    // Execute Live State Mutation on Database (Function Calling)
    let updatedHp = character.currentHp;
    let updatedGold = character.gold || 0;
    let updatedInventory = [...(character.inventory || [])];

    if (aiResponse.mutation) {
      // HP Mutation (Damage / Heal)
      if (aiResponse.mutation.hpChange !== 0) {
        if (aiResponse.mutation.hpChange < 0) {
          // Take damage
          const dmg = Math.abs(aiResponse.mutation.hpChange);
          updatedHp = Math.max(0, updatedHp - dmg);
        } else {
          // Heal
          updatedHp = Math.min(character.maxHp, updatedHp + aiResponse.mutation.hpChange);
        }
      }

      // Gold Mutation
      if (aiResponse.mutation.goldChange && aiResponse.mutation.goldChange !== 0) {
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

      await character.update({
        currentHp: updatedHp,
        gold: updatedGold,
        inventory: updatedInventory,
      });
    }

    return res.json({
      success: true,
      data: {
        aiResponse,
        character: {
          id: character.id,
          currentHp: updatedHp,
          maxHp: character.maxHp,
          gold: updatedGold,
          inventory: updatedInventory,
          armorClass: character.armorClass,
        }
      }
    });
  } catch (error) {
    console.error('Adventure Action Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses narasi petualangan', error: error.message });
  }
};
