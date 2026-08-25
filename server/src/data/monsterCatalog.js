const MONSTER_BESTIARY = [
  {
    id: 'goblin_scout',
    name: 'Goblin Pengintai',
    type: 'Humanoid Kecil',
    cr: '1/4',
    expReward: 50,
    goldReward: 8,
    maxHp: 7,
    currentHp: 7,
    armorClass: 13,
    speed: 30, // 6 petak
    icon: '👺',
    avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80',
    attackBonus: 4,
    damageDice: '1d6+2',
    attackName: 'Tebasan Belati Karat',
    aiType: 'aggressive',
    desc: 'Makhluk kecil licik yang menyerang secara tiba-tiba dari balik semak.'
  },
  {
    id: 'skeleton_warrior',
    name: 'Prajurit Tengkorak Makam',
    type: 'Undead',
    cr: '1/2',
    expReward: 100,
    goldReward: 12,
    maxHp: 13,
    currentHp: 13,
    armorClass: 13,
    speed: 30,
    icon: '💀',
    avatar: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80',
    attackBonus: 4,
    damageDice: '1d6+2',
    attackName: 'Tembakan Panah Kuno',
    aiType: 'ranged',
    desc: 'Kerangka prajurit kuno yang dibangkitkan oleh energi sihir kegelapan.'
  },
  {
    id: 'orc_berserker',
    name: 'Orc Berserker Liar',
    type: 'Humanoid Sedang',
    cr: '1',
    expReward: 200,
    goldReward: 25,
    maxHp: 22,
    currentHp: 22,
    armorClass: 13,
    speed: 30,
    icon: '👹',
    avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80',
    attackBonus: 5,
    damageDice: '1d12+3',
    attackName: 'Hantaman Kapak Raksasa (Greataxe)',
    aiType: 'aggressive',
    desc: 'Pejuang orc berbadan kekar yang menyerang membabi buta dengan kapak dua tangan.'
  },
  {
    id: 'young_red_dragon',
    name: 'Naga Wyrm Merah',
    type: 'Naga Purba (Bos)',
    cr: '3',
    expReward: 700,
    goldReward: 150,
    maxHp: 45,
    currentHp: 45,
    armorClass: 16,
    speed: 35,
    icon: '🐲',
    avatar: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80',
    attackBonus: 7,
    damageDice: '2d10+4',
    attackName: 'Cakaran Berapi & Gigitan Maut',
    aiType: 'boss',
    desc: 'Naga muda bersisik merah bara yang menyemburkan nafas api pelebur batu.'
  }
];

module.exports = {
  MONSTER_BESTIARY
};
