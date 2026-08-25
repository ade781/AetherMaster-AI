const { Character } = require('../models');

// Helper to calculate Ability Modifier
const calcMod = (score) => Math.floor((score - 10) / 2);

// @desc    Get all characters
// @route   GET /api/characters
// @access  Public (Open-Access)
exports.getAllCharacters = async (req, res) => {
  try {
    const characters = await Character.findAll({
      order: [['updatedAt', 'DESC']],
    });
    return res.json({ success: true, count: characters.length, data: characters });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch characters', error: error.message });
  }
};

// @desc    Get single character by ID
// @route   GET /api/characters/:id
// @access  Public (Open-Access)
exports.getCharacterById = async (req, res) => {
  try {
    const character = await Character.findByPk(req.params.id);

    if (!character) {
      return res.status(404).json({ success: false, message: 'Character not found' });
    }

    return res.json({ success: true, data: character });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch character', error: error.message });
  }
};

// @desc    Create a new character (D&D 5E Rules)
// @route   POST /api/characters
// @access  Public (Open-Access)
exports.createCharacter = async (req, res) => {
  try {
    const {
      name,
      race,
      subrace,
      characterClass,
      subclass,
      background,
      alignment,
      strength = 10,
      dexterity = 10,
      constitution = 10,
      intelligence = 10,
      wisdom = 10,
      charisma = 10,
      speed = 30,
      skills = [],
      savingThrows = [],
      features = [],
      inventory = [],
      spells = [],
      gold = 15,
      avatarUrl,
      bio,
    } = req.body;

    if (!name || !characterClass || !race) {
      return res.status(400).json({ success: false, message: 'Name, Class, and Race are required' });
    }

    const hitDiceMap = {
      Barbarian: 12,
      Fighter: 10,
      Paladin: 10,
      Ranger: 10,
      Bard: 8,
      Cleric: 8,
      Druid: 8,
      Monk: 8,
      Rogue: 8,
      Warlock: 8,
      Sorcerer: 6,
      Wizard: 6,
    };

    const baseHitDie = hitDiceMap[characterClass] || 8;
    const conMod = calcMod(constitution);
    const calculatedMaxHp = Math.max(1, baseHitDie + conMod);
    const dexMod = calcMod(dexterity);
    const calculatedAc = 10 + dexMod;

    const character = await Character.create({
      name,
      race,
      subrace,
      characterClass,
      subclass,
      background: background || 'Acolyte',
      alignment: alignment || 'Neutral Good',
      level: 1,
      experience: 0,
      strength,
      dexterity,
      constitution,
      intelligence,
      wisdom,
      charisma,
      maxHp: calculatedMaxHp,
      currentHp: calculatedMaxHp,
      tempHp: 0,
      armorClass: calculatedAc,
      speed,
      proficiencyBonus: 2,
      skills,
      savingThrows,
      features,
      inventory: inventory.length > 0 ? inventory : undefined,
      spells,
      gold,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
      bio,
    });

    return res.status(201).json({
      success: true,
      message: 'Character created successfully',
      data: character,
    });
  } catch (error) {
    console.error('Create character error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create character', error: error.message });
  }
};

// @desc    Update character
// @route   PUT /api/characters/:id
// @access  Public (Open-Access)
exports.updateCharacter = async (req, res) => {
  try {
    const character = await Character.findByPk(req.params.id);

    if (!character) {
      return res.status(404).json({ success: false, message: 'Character not found' });
    }

    await character.update(req.body);
    return res.json({ success: true, message: 'Character updated', data: character });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update character', error: error.message });
  }
};

// @desc    Quick HP modifier (damage/heal)
// @route   PATCH /api/characters/:id/hp
// @access  Public (Open-Access)
exports.modifyHp = async (req, res) => {
  try {
    const { amount, type } = req.body;
    const character = await Character.findByPk(req.params.id);

    if (!character) {
      return res.status(404).json({ success: false, message: 'Character not found' });
    }

    let newCurrent = character.currentHp;
    let newTemp = character.tempHp;

    if (type === 'damage') {
      let dmg = parseInt(amount, 10);
      if (newTemp > 0) {
        if (newTemp >= dmg) {
          newTemp -= dmg;
          dmg = 0;
        } else {
          dmg -= newTemp;
          newTemp = 0;
        }
      }
      newCurrent = Math.max(0, newCurrent - dmg);
    } else if (type === 'heal') {
      newCurrent = Math.min(character.maxHp, newCurrent + parseInt(amount, 10));
    } else if (type === 'temp') {
      newTemp = Math.max(newTemp, parseInt(amount, 10));
    } else if (type === 'set') {
      newCurrent = Math.min(character.maxHp, Math.max(0, parseInt(amount, 10)));
    }

    await character.update({ currentHp: newCurrent, tempHp: newTemp });
    return res.json({ success: true, data: { currentHp: newCurrent, tempHp: newTemp, maxHp: character.maxHp } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to modify HP', error: error.message });
  }
};

// @desc    Level up character
// @route   POST /api/characters/:id/levelup
// @access  Public (Open-Access)
exports.levelUpCharacter = async (req, res) => {
  try {
    const character = await Character.findByPk(req.params.id);

    if (!character) {
      return res.status(404).json({ success: false, message: 'Character not found' });
    }

    const nextLevel = character.level + 1;
    const conMod = calcMod(character.constitution);

    const hitDiceMap = {
      Barbarian: 12, Fighter: 10, Paladin: 10, Ranger: 10,
      Bard: 8, Cleric: 8, Druid: 8, Monk: 8, Rogue: 8, Warlock: 8,
      Sorcerer: 6, Wizard: 6,
    };
    const hitDie = hitDiceMap[character.characterClass] || 8;
    const avgHpGain = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);

    let profBonus = 2;
    if (nextLevel >= 17) profBonus = 6;
    else if (nextLevel >= 13) profBonus = 5;
    else if (nextLevel >= 9) profBonus = 4;
    else if (nextLevel >= 5) profBonus = 3;

    const newMaxHp = character.maxHp + avgHpGain;
    const newCurrentHp = character.currentHp + avgHpGain;

    await character.update({
      level: nextLevel,
      maxHp: newMaxHp,
      currentHp: newCurrentHp,
      proficiencyBonus: profBonus,
    });

    return res.json({
      success: true,
      message: `Congratulations! ${character.name} reached Level ${nextLevel}!`,
      data: character,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to level up', error: error.message });
  }
};

// @desc    Delete character
// @route   DELETE /api/characters/:id
// @access  Public (Open-Access)
exports.deleteCharacter = async (req, res) => {
  try {
    const character = await Character.findByPk(req.params.id);

    if (!character) {
      return res.status(404).json({ success: false, message: 'Character not found' });
    }

    await character.destroy();
    return res.json({ success: true, message: 'Character deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete character', error: error.message });
  }
};
