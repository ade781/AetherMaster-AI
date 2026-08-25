const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING(100),
    defaultValue: 'Dungeon Master Anonim',
  },
  synopsis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  genre: {
    type: DataTypes.STRING(50),
    defaultValue: 'Dark Fantasy',
  },
  difficulty: {
    type: DataTypes.STRING(50),
    defaultValue: 'Menengah (Tingkat 1-4)',
  },
  coverImage: {
    type: DataTypes.STRING,
    defaultValue: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
  },
  // Visual Quest Tree / Flow Nodes
  questNodes: {
    type: DataTypes.JSON,
    defaultValue: [
      { id: 'node_1', title: 'Awal Petualangan: Gerbang Makam', type: 'narrative', desc: 'Pemain berdiri di depan pintu gerbang batu kuno yang tertutup lumut.', nextNodes: ['node_2', 'node_3'] },
      { id: 'node_2', title: 'Lorong Kiri: Perangkap Panah Racun', type: 'trap', desc: 'Lantai berderit memicu semburan panah dari dinding.', nextNodes: ['node_4'] },
      { id: 'node_3', title: 'Lorong Kanan: Ruang Harta Karun', type: 'loot', desc: 'Sebuah peti perunggu kuno berkilau di atas altar.', nextNodes: ['node_4'] },
      { id: 'node_4', title: 'Ruang Utama: Duel Sang Penjaga Makam', type: 'boss', desc: 'Pertarungan puncak melawan Ksatria Makam Abadi.', nextNodes: [] },
    ],
  },
  // World Codex & Lorebook
  lorebook: {
    type: DataTypes.JSON,
    defaultValue: [
      { id: 'lore_1', topic: 'Kerajaan Eldoria', content: 'Kerajaan megah di utara yang runtuh 500 tahun lalu akibat kutukan raja tirani.' },
      { id: 'lore_2', topic: 'Kultus Bayangan Merah', content: 'Organisasi rahasia pemuja naga yang bersembunyi di dalam terowongan bawah tanah.' },
    ],
  },
  // Custom Monsters & NPC
  customMonsters: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  // Dungeon Map Tile Layout (8x8 grid)
  mapLayout: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

module.exports = Campaign;
