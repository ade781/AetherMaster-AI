const { Character } = require('../models');
const { BASE_ITEMS, BASE_SPELLS, BASE_CONDITIONS } = require('../data/dndCatalog');

const calcMod = (score) => Math.floor((score - 10) / 2);

// Recalculate character Armor Class and Speed dynamically based on equipment
const recalculateStats = (character) => {
  const dexMod = calcMod(character.dexterity);
  const equipment = character.equipment || {};

  let finalAc = 10 + dexMod;
  let finalSpeed = character.speed || 30;

  // Chest Armor Calculation
  if (equipment.chest) {
    if (equipment.chest.baseAc) {
      finalAc = equipment.chest.type === 'armor' && equipment.chest.baseAc >= 15
        ? equipment.chest.baseAc // Heavy armor doesn't add DEX
        : equipment.chest.baseAc + dexMod;
    } else if (equipment.chest.acBonus) {
      finalAc += equipment.chest.acBonus;
    }
  }

  // Shield Bonus (+2 AC)
  if (equipment.offHand && equipment.offHand.type === 'shield') {
    finalAc += equipment.offHand.acBonus || 2;
  }

  // Ring Bonus (+1 AC)
  if (equipment.ring && equipment.ring.acBonus) {
    finalAc += equipment.ring.acBonus;
  }

  // Boots speed bonus
  if (equipment.boots && equipment.boots.speedBonus) {
    finalSpeed += equipment.boots.speedBonus;
  }

  return { armorClass: finalAc, speed: finalSpeed };
};

// @desc    Get all characters
exports.getAllCharacters = async (req, res) => {
  try {
    const characters = await Character.findAll({ order: [['updatedAt', 'DESC']] });
    return res.json({ success: true, count: characters.length, data: characters });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil karakter', error: error.message });
  }
};

// @desc    Get catalog items and spells
exports.getCatalog = async (req, res) => {
  return res.json({
    success: true,
    data: {
      items: BASE_ITEMS,
      spells: BASE_SPELLS,
      conditions: BASE_CONDITIONS
    }
  });
};

// @desc    Get single character by ID
exports.getCharacterById = async (req, res) => {
  try {
    const character = await Character.findByPk(req.params.id);
    if (!character) return res.status(404).json({ success: false, message: 'Karakter tidak ditemukan' });
    return res.json({ success: true, data: character });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil karakter', error: error.message });
  }
};

// @desc    Create character
exports.createCharacter = async (req, res) => {
  try {
    const {
      name, race, characterClass, background, alignment,
      strength = 10, dexterity = 10, constitution = 10,
      intelligence = 10, wisdom = 10, charisma = 10,
      speed = 30, bio,
    } = req.body;

    if (!name || !characterClass || !race) {
      return res.status(400).json({ success: false, message: 'Nama, Kelas, dan Ras wajib diisi' });
    }

    const hitDiceMap = {
      'Pendekar': 10, 'Fighter': 10, 'Paladin': 10, 'Ksatria Suci': 10,
      'Penyihir': 6, 'Wizard': 6, 'Sorcerer': 6,
      'Pengelana Bayangan': 8, 'Rogue': 8, 'Pendeta Suci': 8, 'Cleric': 8,
      'Petarung Liar': 12, 'Barbarian': 12,
    };

    const baseHitDie = hitDiceMap[characterClass] || 8;
    const conMod = calcMod(constitution);
    const calculatedMaxHp = Math.max(1, baseHitDie + conMod);
    const dexMod = calcMod(dexterity);
    const calculatedAc = 10 + dexMod;

    const character = await Character.create({
      name,
      race,
      characterClass,
      background: background || 'Prajurit Kerajaan',
      alignment: alignment || 'Neutral Good',
      strength, dexterity, constitution, intelligence, wisdom, charisma,
      maxHp: calculatedMaxHp,
      currentHp: calculatedMaxHp,
      baseArmorClass: calculatedAc,
      armorClass: calculatedAc,
      speed,
      bio,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
    });

    return res.status(201).json({ success: true, message: 'Karakter berhasil ditempa', data: character });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal membuat karakter', error: error.message });
  }
};

// @desc    Equip / Unequip Item with Dynamic Stat Sync (AC/Speed)
exports.toggleEquipItem = async (req, res) => {
  try {
    const { item, slot, action } = req.body; // action: 'equip' | 'unequip'
    const character = await Character.findByPk(req.params.id);

    if (!character) return res.status(404).json({ success: false, message: 'Karakter tidak ditemukan' });

    let equipment = { ...character.equipment };
    let inventory = [...(character.inventory || [])];

    if (action === 'equip') {
      // Jika ada item lama di slot itu, kembalikan ke inventory
      if (equipment[slot]) {
        inventory.push(equipment[slot]);
      }
      equipment[slot] = item;
      inventory = inventory.filter(i => i.id !== item.id);
    } else {
      // Unequip
      if (equipment[slot]) {
        inventory.push(equipment[slot]);
        equipment[slot] = null;
      }
    }

    // Dynamic Stat Calculation
    const { armorClass } = recalculateStats({ ...character.toJSON(), equipment });

    await character.update({ equipment, inventory, armorClass });
    return res.json({ success: true, data: character });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah perlengkapan', error: error.message });
  }
};

// @desc    Cast Spell & Spell Slot Consumption
exports.castSpell = async (req, res) => {
  try {
    const { spellId, level } = req.body;
    const character = await Character.findByPk(req.params.id);
    if (!character) return res.status(404).json({ success: false, message: 'Karakter tidak ditemukan' });

    let spellSlots = { ...character.spellSlots };
    const levelKey = `level${level}`;

    if (level > 0) {
      if (!spellSlots[levelKey] || spellSlots[levelKey].current <= 0) {
        return res.status(400).json({ success: false, message: `Slot mantra level ${level} sudah habis!` });
      }
      spellSlots[levelKey].current -= 1;
    }

    await character.update({ spellSlots });
    return res.json({ success: true, message: 'Mantra berhasil dirapalkan!', data: { spellSlots } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal merapalkan mantra', error: error.message });
  }
};

// @desc    Toggle Condition (Buff/Debuff)
exports.toggleCondition = async (req, res) => {
  try {
    const { condition } = req.body;
    const character = await Character.findByPk(req.params.id);
    if (!character) return res.status(404).json({ success: false, message: 'Karakter tidak ditemukan' });

    let conditions = [...(character.conditions || [])];
    const existsIndex = conditions.findIndex(c => c.id === condition.id);

    if (existsIndex >= 0) {
      conditions.splice(existsIndex, 1); // Remove
    } else {
      conditions.push(condition); // Add
    }

    await character.update({ conditions });
    return res.json({ success: true, data: { conditions } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah status', error: error.message });
  }
};

// @desc    Modify HP
exports.modifyHp = async (req, res) => {
  try {
    const { amount, type } = req.body;
    const character = await Character.findByPk(req.params.id);
    if (!character) return res.status(404).json({ success: false, message: 'Karakter tidak ditemukan' });

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
    }

    await character.update({ currentHp: newCurrent, tempHp: newTemp });
    return res.json({ success: true, data: { currentHp: newCurrent, tempHp: newTemp, maxHp: character.maxHp } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah HP', error: error.message });
  }
};

// @desc    Update Character attributes (HP, Gold, Inventory, etc.)
exports.updateCharacter = async (req, res) => {
  try {
    const character = await Character.findByPk(req.params.id);
    if (!character) return res.status(404).json({ success: false, message: 'Karakter tidak ditemukan' });

    await character.update(req.body);
    return res.json({ success: true, message: 'Karakter berhasil diperbarui', data: character });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui karakter', error: error.message });
  }
};

// @desc    Level Up
exports.levelUpCharacter = async (req, res) => {
  try {
    const character = await Character.findByPk(req.params.id);
    if (!character) return res.status(404).json({ success: false, message: 'Karakter tidak ditemukan' });

    const nextLevel = character.level + 1;
    const conMod = calcMod(character.constitution);
    const hpGain = Math.max(1, 6 + conMod);
    const newMaxHp = character.maxHp + hpGain;
    const newHp = character.currentHp + hpGain;

    let spellSlots = { ...character.spellSlots };
    if (nextLevel >= 2) spellSlots.level1 = { max: 3, current: 3 };
    if (nextLevel >= 3) spellSlots.level2 = { max: 2, current: 2 };

    await character.update({
      level: nextLevel,
      maxHp: newMaxHp,
      currentHp: newHp,
      spellSlots,
      proficiencyBonus: nextLevel >= 5 ? 3 : 2,
    });

    return res.json({ success: true, message: `Selamat! Naik ke Tingkat ${nextLevel}!`, data: character });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal level up', error: error.message });
  }
};

// @desc    Delete
exports.deleteCharacter = async (req, res) => {
  try {
    const character = await Character.findByPk(req.params.id);
    if (!character) return res.status(404).json({ success: false, message: 'Karakter tidak ditemukan' });
    await character.destroy();
    return res.json({ success: true, message: 'Karakter berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus karakter', error: error.message });
  }
};
