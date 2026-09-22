import React, { useState } from 'react';
import { Shield, Sparkles, Wand2, Swords, Crosshair, Heart, Footprints, Flame, Music, Check, X } from 'lucide-react';
import audio from '../services/audioService';
import { calculateMod } from '../utils/rpgMath';

const CLASSES = [
  {
    id: 'warrior',
    name: 'Warrior (Fighter)',
    icon: Swords,
    desc: 'Mahir senjata berat, pertahanan baja kokoh, dan HP tertinggi di garis depan.',
    stats: { hp: 35, mana: 15, str: 16, dex: 12, con: 15, int: 9, wis: 10, cha: 11 },
    avatar: 'char_hero_01_paladin',
    starterItem: { id: 'item_08_dragon_shield', name: 'Dragon Shield', category: 'Perisai', effect: '+2 AC Pertahanan', icon: 'item_08_dragon_shield' }
  },
  {
    id: 'rogue',
    name: 'Rogue (Shadow)',
    icon: Footprints,
    desc: 'Ahli stealth, membuka kunci perangkap, dan melancarkan serangan kritikal.',
    stats: { hp: 28, mana: 18, str: 10, dex: 16, con: 12, int: 13, wis: 12, cha: 14 },
    avatar: 'char_hero_05_rogue',
    starterItem: { id: 'item_04_silver_dagger', name: 'Silver Dagger', category: 'Senjata', effect: 'Bonus serangan cepat', icon: 'item_04_silver_dagger' }
  },
  {
    id: 'mage',
    name: 'Mage (Wizard)',
    icon: Wand2,
    desc: 'Penguasa mantra elemen Aether, manipulasi ruang, dan analisa arkanum.',
    stats: { hp: 24, mana: 35, str: 8, dex: 13, con: 11, int: 17, wis: 14, cha: 10 },
    avatar: 'char_hero_03_wizard',
    starterItem: { id: 'item_03_grimoire', name: 'Ancient Grimoire', category: 'Relik', effect: '+15 Max Mana', icon: 'item_03_grimoire' }
  },
  {
    id: 'cleric',
    name: 'Cleric (Battle Priest)',
    icon: Sparkles,
    desc: 'Diberkati cahaya suci penyembuh, penghalau arwah terkutuk, dan penegak keadilan.',
    stats: { hp: 30, mana: 25, str: 13, dex: 10, con: 14, int: 10, wis: 16, cha: 13 },
    avatar: 'char_hero_06_cleric',
    starterItem: { id: 'item_05_cursed_amulet', name: 'Blessed Talisman', category: 'Amulet', effect: 'Perlindungan dari kutukan', icon: 'item_05_cursed_amulet' }
  },
  {
    id: 'ranger',
    name: 'High-Elf Ranger',
    icon: Crosshair,
    desc: 'Penembak runduk ulung, navigasi rimba liar, dan indra penglihatan tajam.',
    stats: { hp: 28, mana: 20, str: 11, dex: 17, con: 13, int: 12, wis: 15, cha: 10 },
    avatar: 'char_hero_02_ranger',
    starterItem: { id: 'item_07_golden_compass', name: 'Golden Compass', category: 'Alat', effect: '+2 WIS saat eksplorasi', icon: 'item_07_golden_compass' }
  },
  {
    id: 'warlock',
    name: 'Tiefling Warlock',
    icon: Flame,
    desc: 'Menjalin pakta gelap dengan entitas eldritch untuk kekuatan sihir destruktif.',
    stats: { hp: 26, mana: 30, str: 9, dex: 14, con: 12, int: 14, wis: 11, cha: 17 },
    avatar: 'char_hero_07_warlock',
    starterItem: { id: 'item_02_potion_mana', name: 'Celestial Mana Elixir', category: 'Obat', effect: 'Pulihkan 20 Mana', icon: 'item_02_potion_mana' }
  }
];

const RACES = [
  { id: 'human', name: 'Human', trait: '+1 ke Seluruh Atribut' },
  { id: 'elf', name: 'High Elf', trait: 'Kepekaan Penglihatan Kegelapan & Imun Tidur' },
  { id: 'dwarf', name: 'Mountain Dwarf', trait: 'Ketahanan Racun & Bonus Pertahanan Fisik' },
  { id: 'tiefling', name: 'Tiefling', trait: 'Resistensi Api Api Neraka & Sihir Gelap' },
  { id: 'dragonborn', name: 'Dragonborn', trait: 'Nafas Elemen Naga & Sisik Keras' }
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
              <div className="grid grid-cols-3 gap-2">
                {RACES.slice(0, 3).map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => handleSelectRace(r)}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all truncate ${
                      selectedRace.id === r.id
                        ? 'bg-fantasy-gold/20 border-fantasy-gold text-fantasy-gold shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Class Picker */}
          <div>
            <label className="block font-cinzel text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Pilih Kelas (D&D 5E Archetype)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {CLASSES.map((cls) => {
                const Icon = cls.icon;
                const isSelected = selectedClass.id === cls.id;
                return (
                  <button
                    type="button"
                    key={cls.id}
                    onClick={() => handleSelectClass(cls)}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                      isSelected
                        ? 'bg-gradient-to-b from-fantasy-gold/20 to-slate-900 border-fantasy-gold shadow-lg shadow-fantasy-gold/20 scale-[1.03]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-fantasy-border/60 mb-2 bg-slate-900">
                      <img
                        src={`/assets/portraits/${cls.avatar}.png`}
                        alt={cls.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/assets/portraits/char_hero_01_paladin.png'; }}
                      />
                    </div>
                    <span className="font-cinzel text-xs font-bold text-white leading-tight">
                      {cls.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      HP {cls.stats.hp}
                    </span>
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
