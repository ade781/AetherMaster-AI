import React, { useState } from 'react';
import { Shield, Wand2, Swords, Footprints, Check, X, Heart, Sparkles } from 'lucide-react';
import audio from '../services/audioService';
import { calculateMod } from '../utils/rpgMath';

const CLASSES = [
  {
    id: 'warrior',
    name: 'Warrior',
    title: 'Fighter & Vanguard',
    icon: Swords,
    focus: 'HP Tinggi & Pertarungan Fisik',
    desc: 'Ahli senjata tempur berat dan pertahanan baja kokoh. Memiliki HP tertinggi untuk memimpin pertempuran di garis depan.',
    stats: { hp: 35, mana: 12, str: 16, dex: 12, con: 15, int: 9, wis: 10, cha: 11 },
    avatar: 'char_hero_04_dwarf',
    starterItem: { id: 'item_11_flame_sword', name: 'Iron Greatsword', category: 'Senjata', effect: '+5 Serangan Fisik Tebasan', icon: 'item_11_flame_sword' }
  },
  {
    id: 'rogue',
    name: 'Rogue',
    title: 'Shadow Infiltrator',
    icon: Footprints,
    focus: 'Agility, Stealth & Critical',
    desc: 'Pakar menyusup dalam bayangan, membobol jebakan, dan meluncurkan serangan kritikal mematikan dengan refleks secepat kilat.',
    stats: { hp: 28, mana: 16, str: 10, dex: 16, con: 12, int: 13, wis: 12, cha: 14 },
    avatar: 'char_hero_05_rogue',
    starterItem: { id: 'item_04_silver_dagger', name: 'Silver Dagger', category: 'Senjata', effect: 'Bonus serangan cepat & kritikal', icon: 'item_04_silver_dagger' }
  },
  {
    id: 'mage',
    name: 'Mage',
    title: 'Arcane Spellcaster',
    icon: Wand2,
    focus: 'Intelligence & Spellcasting',
    desc: 'Pengendali energi Aether murni dan manipulasi elemen arkanum. Didukung cadangan Mana melimpah untuk mantra penghancur.',
    stats: { hp: 24, mana: 35, str: 8, dex: 13, con: 11, int: 17, wis: 14, cha: 10 },
    avatar: 'char_hero_03_wizard',
    starterItem: { id: 'item_03_grimoire', name: 'Ancient Grimoire', category: 'Relik', effect: '+15 Max Mana', icon: 'item_03_grimoire' }
  },
  {
    id: 'paladin',
    name: 'Paladin',
    title: 'Holy Guardian',
    icon: Shield,
    focus: 'Hybrid Tank & Holy Support',
    desc: 'Ksatria suci bertameng tebal penahan serangan musuh, diperkuat berkah cahaya penyembuh dan aura perlindungan sekutu.',
    stats: { hp: 32, mana: 22, str: 15, dex: 10, con: 14, int: 10, wis: 13, cha: 15 },
    avatar: 'char_hero_01_paladin',
    starterItem: { id: 'item_08_dragon_shield', name: 'Dragon Shield', category: 'Perisai', effect: '+2 AC Pertahanan Suci', icon: 'item_08_dragon_shield' }
  }
];

const RACES = [
  { id: 'human', name: 'Human', trait: '+1 ke Seluruh Atribut' },
  { id: 'elf', name: 'High Elf', trait: 'Kepekaan Penglihatan & Imun Tidur' },
  { id: 'dwarf', name: 'Mountain Dwarf', trait: 'Ketahanan Racun & Bonus Pertahanan' },
  { id: 'tiefling', name: 'Tiefling', trait: 'Resistensi Api & Sihir Gelap' },
  { id: 'dragonborn', name: 'Dragonborn', trait: 'Nafas Naga & Sisik Keras' }
];

export default function CharacterCreationModal({ isOpen, onClose, onConfirm, campaign, isLoading }) {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedRace, setSelectedRace] = useState(RACES[0]);
  const [name, setName] = useState('Alden Stormcaller');

  if (!isOpen) return null;

  const handleSelectClass = (cls) => {
    audio.playClick();
    setSelectedClass(cls);
  };

  const handleSelectRace = (r) => {
    audio.playClick();
    setSelectedRace(r);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;
    audio.playSelect();
    onConfirm({
      name: name.trim(),
      race: selectedRace.id,
      characterClass: selectedClass.id,
      avatarUrl: selectedClass.avatar,
      str: selectedClass.stats.str,
      dex: selectedClass.stats.dex,
      con: selectedClass.stats.con,
      int: selectedClass.stats.int,
      wis: selectedClass.stats.wis,
      cha: selectedClass.stats.cha,
      starterItem: selectedClass.starterItem
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-fantasy-card border-2 border-fantasy-gold/50 rounded-2xl shadow-2xl shadow-fantasy-dark overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-fantasy-surface to-slate-900 border-b border-fantasy-border flex items-center justify-between">
          <div>
            <h2 className="font-cinzel text-xl md:text-2xl font-bold text-fantasy-gold tracking-wider flex items-center gap-2">
              <Shield className="w-6 h-6 text-fantasy-gold" />
              Pembuatan Karakter Petualang
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Kampanye: <span className="text-fantasy-gold font-semibold">{campaign?.title || 'Misteri Aether'}</span>
            </p>
          </div>
          <button
            onClick={() => { audio.playClick(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Name & Race Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-cinzel text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nama Petualang
              </label>
              <input
                type="text"
                required
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-fantasy-border focus:border-fantasy-gold rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors disabled:opacity-50"
                placeholder="cth: Alden Stormcaller"
              />
            </div>
            <div>
              <label className="block font-cinzel text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Ras Petualang
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {RACES.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => handleSelectRace(r)}
                    className={`py-2 px-1 text-[11px] font-medium rounded-lg border transition-all text-center truncate ${
                      selectedRace.id === r.id
                        ? 'bg-fantasy-gold/20 border-fantasy-gold text-fantasy-gold shadow-sm font-semibold'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={isLoading}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Class Picker - 4 Classic Archetypes */}
          <div>
            <label className="block font-cinzel text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Pilih Kelas (4 Fondasi D&D 5E)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {CLASSES.map((cls) => {
                const Icon = cls.icon;
                const isSelected = selectedClass.id === cls.id;
                return (
                  <button
                    type="button"
                    key={cls.id}
                    onClick={() => handleSelectClass(cls)}
                    className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-gradient-to-b from-fantasy-gold/25 via-slate-900 to-slate-950 border-fantasy-gold shadow-xl shadow-fantasy-gold/20 scale-[1.02]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-fantasy-gold text-slate-950 flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-fantasy-border/60 mb-2.5 bg-slate-900 shadow-md">
                      <img
                        src={`/assets/portraits/${cls.avatar}.png`}
                        alt={cls.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/assets/portraits/char_hero_01_paladin.png'; }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3.5 h-3.5 text-fantasy-gold" />
                      <span className="font-cinzel text-sm font-bold text-white tracking-wide">
                        {cls.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300/80 font-medium px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-2">
                      {cls.focus}
                    </span>
                    <div className="flex items-center justify-center gap-3 text-[10px] text-slate-300 w-full pt-1.5 border-t border-slate-800/80">
                      <span className="flex items-center gap-1 text-rose-400 font-mono font-semibold">
                        <Heart className="w-2.5 h-2.5 fill-rose-500" /> {cls.stats.hp} HP
                      </span>
                      <span className="flex items-center gap-1 text-sky-400 font-mono font-semibold">
                        <Sparkles className="w-2.5 h-2.5" /> {cls.stats.mana} Mana
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Preview Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-fantasy-border flex flex-col md:flex-row items-center gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-fantasy-gold shadow-md flex-shrink-0 bg-slate-900">
              <img
                src={`/assets/portraits/${selectedClass.avatar}.png`}
                alt={selectedClass.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h3 className="font-cinzel text-lg font-bold text-fantasy-gold">
                  {name || 'Tanpa Nama'} the {selectedClass.name}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedRace.name}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{selectedClass.desc}</p>
              
              {/* Stat Matrix */}
              <div className="mt-3 grid grid-cols-6 gap-2 text-center">
                {Object.entries(selectedClass.stats).slice(2).map(([stat, val]) => (
                  <div key={stat} className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">{stat}</span>
                    <span className="font-cinzel font-bold text-sm text-white">{val}</span>
                    <span className="block text-[10px] text-fantasy-gold">{calculateMod(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => { audio.playClick(); onClose(); }}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fantasy-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-cinzel font-bold text-sm tracking-wide shadow-lg shadow-fantasy-gold/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-80 disabled:cursor-wait min-w-[200px] justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  Mempersiapkan Dunia...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Mulai Petualangan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
