const BASE_ITEMS = [
  { id: 'longsword', name: 'Pedang Panjang (Longsword)', type: 'weapon', slot: 'mainHand', damage: '1d8 tebasan', weight: 3, value: 15, desc: 'Pedang baja bermata ganda standar prajurit tangguh.' },
  { id: 'shortbow', name: 'Busur Pendek (Shortbow)', type: 'weapon', slot: 'mainHand', damage: '1d6 tusukan', weight: 2, value: 25, desc: 'Busur ringan dengan jangkauan 80/320 kaki.' },
  { id: 'dagger', name: 'Belati Baja (Dagger)', type: 'weapon', slot: 'offHand', damage: '1d4 tusukan', weight: 1, value: 2, desc: 'Senjata ringan dan mudah disembunyikan.' },
  { id: 'leather_armor', name: 'Zirah Kulit (Leather Armor)', type: 'armor', slot: 'chest', acBonus: 1, baseAc: 11, weight: 10, value: 10, desc: 'Zirah pelindung dari kulit binatang samak (AC 11 + DEX).' },
  { id: 'chain_mail', name: 'Zirah Rantai (Chain Mail)', type: 'armor', slot: 'chest', acBonus: 6, baseAc: 16, weight: 55, value: 75, desc: 'Zirah cincin besi berat pelindung tubuh penuh (AC 16).' },
  { id: 'shield', name: 'Perisai Kayu Berpaku (Shield)', type: 'shield', slot: 'offHand', acBonus: 2, weight: 6, value: 10, desc: 'Perisai bundar yang memberi tambahan +2 Armor Class.' },
  { id: 'iron_helm', name: 'Helm Tempur Besi', type: 'helmet', slot: 'head', weight: 4, value: 8, desc: 'Pelindung kepala dari hantaman benda tumpul.' },
  { id: 'ring_of_protection', name: 'Cincin Perlindungan Sihir', type: 'ring', slot: 'ring', acBonus: 1, weight: 0.1, value: 120, desc: 'Cincin bermata delima yang memancarkan aura magis penangkis serangan (+1 AC).' },
  { id: 'boots_of_speed', name: 'Sepatu Pengembara Angin', type: 'boots', slot: 'boots', speedBonus: 5, weight: 2, value: 80, desc: 'Sepatu kulit ringan yang meningkatkan kecepatan langkah +5 kaki.' },
  { id: 'healing_potion', name: 'Ramuan Pemulih (Healing Potion)', type: 'consumable', healDice: '2d4+2', weight: 0.5, value: 50, desc: 'Cairan merah berkilau yang memulihkan 2d4+2 HP saat diminum.' },
  { id: 'torch', name: 'Obor Minyak', type: 'item', weight: 1, value: 0.1, desc: 'Menerangi area sekitar 20 kaki selama 1 jam.' },
  { id: 'rations', name: 'Ransum Makanan (1 Hari)', type: 'item', weight: 2, value: 0.5, desc: 'Bekal makanan kering untuk perjalanan jauh.' }
];

const BASE_SPELLS = [
  { id: 'firebolt', name: 'Fire Bolt (Panah Api)', level: 0, school: 'Evocation', castingTime: '1 Aksi', range: '120 kaki', damage: '1d10 api', desc: 'Kamu melontarkan gumpalan api menyala ke arah musuh.' },
  { id: 'mage_armor', name: 'Mage Armor (Zirah Sihir)', level: 1, school: 'Abjuration', castingTime: '1 Aksi', range: 'Sentuhan', desc: 'Menyelimuti target dengan pelindung magis (AC menjadi 13 + DEX) selama 8 jam.' },
  { id: 'magic_missile', name: 'Magic Missile (Rudal Sihir)', level: 1, school: 'Evocation', castingTime: '1 Aksi', range: '120 kaki', damage: '3x (1d4+1) gaya', desc: 'Menciptakan 3 anak panah bercahaya yang pasti mengenai target tanpa meleset.' },
  { id: 'cure_wounds', name: 'Cure Wounds (Penyembuh Luka)', level: 1, school: 'Evocation', castingTime: '1 Aksi', range: 'Sentuhan', heal: '1d8 + MOD', desc: 'Sentuhan tanganmu memancarkan energi suci penyembuh luka fisik.' },
  { id: 'shield_spell', name: 'Shield (Perisai Tanggap)', level: 1, school: 'Abjuration', castingTime: '1 Reaksi', range: 'Diri Sendiri', desc: 'Penghalang gaib muncul seketika memberikan bonus +5 AC saat diserang.' },
  { id: 'misty_step', name: 'Misty Step (Langkah Kabut)', level: 2, school: 'Conjuration', castingTime: '1 Aksi Bonus', range: 'Diri Sendiri', desc: 'Teleportasi instan sejauh 30 kaki ke area yang dapat kamu lihat.' }
];

const BASE_CONDITIONS = [
  { id: 'blessed', name: 'Diberkati (Blessed)', type: 'buff', desc: 'Mendapat bonus +1d4 pada setiap lemparan serangan dan ability check.', icon: '✨' },
  { id: 'poisoned', name: 'Teracuni (Poisoned)', type: 'debuff', desc: 'Merasa pusing dan lemah, lemparan dadu serangan terkena penalti (Disadvantage).', icon: '🧪' },
  { id: 'blinded', name: 'Kebutaan (Blinded)', type: 'debuff', desc: 'Tidak dapat melihat sekitar, musuh mendapat keuntungan saat menyerangmu.', icon: '👁️' },
  { id: 'inspired', name: 'Inspirasi Heroik', type: 'buff', desc: 'Diberi semangat juang untuk melempar ulang 1 dadu gagal.', icon: '🔥' }
];

module.exports = {
  BASE_ITEMS,
  BASE_SPELLS,
  BASE_CONDITIONS
};
