import React, { useState } from 'react';
import { Shield, Wand2, Swords, Footprints, Check, Heart, Sparkles, User, Package } from 'lucide-react';
import FantasyModal from './common/FantasyModal';
import FantasyButton from './common/FantasyButton';
import FantasyBadge from './common/FantasyBadge';
import audio from '../services/audioService';
import { calculateMod } from '../utils/rpgMath';

const CLASSES = [
  {
    id: 'warrior',
    name: 'Warrior',
    title: 'Vanguard & Pelindung Garis Depan',
    icon: Swords,
    focus: 'Pertahanan Fisik & HP Tinggi',
    desc: 'Ahli senjata tempur berat dan pertahanan baja kokoh. Memiliki ketahanan tubuh tertinggi untuk memimpin pertempuran di garis depan.',
    stats: { hp: 35, mana: 12, str: 16, dex: 12, con: 15, int: 9, wis: 10, cha: 11 },
    avatar: 'char_hero_04_dwarf',
    starterItem: { id: 'item_11_flame_sword', name: 'Iron Greatsword', category: 'Senjata', effect: '+5 Serangan Fisik', icon: 'item_11_flame_sword' }
  },
  {
    id: 'rogue',
    name: 'Rogue',
    title: 'Infiltrator & Penyusup Bayangan',
    icon: Footprints,
    focus: 'Agility & Serangan Kritis',
    desc: 'Pakar menyusup dalam bayangan, membobol jebakan, dan meluncurkan serangan kritikal mematikan dengan refleks secepat kilat.',
    stats: { hp: 28, mana: 16, str: 10, dex: 16, con: 12, int: 13, wis: 12, cha: 14 },
    avatar: 'char_hero_05_rogue',
    starterItem: { id: 'item_04_silver_dagger', name: 'Silver Dagger', category: 'Senjata', effect: 'Bonus Kecepatan & Kritis', icon: 'item_04_silver_dagger' }
  },
  {
    id: 'mage',
    name: 'Mage',
    title: 'Arcane Scholar & Pemangku Elemen',
    icon: Wand2,
    focus: 'Intelligence & Mantra Penghancur',
    desc: 'Pengendali energi Aether murni dan manipulasi elemen arkanum. Didukung cadangan Mana melimpah untuk melantunkan mantra taktis.',
    stats: { hp: 24, mana: 35, str: 8, dex: 13, con: 11, int: 17, wis: 14, cha: 10 },
    avatar: 'char_hero_03_wizard',
    starterItem: { id: 'item_03_grimoire', name: 'Ancient Grimoire', category: 'Relik', effect: '+15 Cadangan Mana', icon: 'item_03_grimoire' }
  },
  {
    id: 'paladin',
    name: 'Paladin',
    title: 'Holy Guardian & Ksatria Cahaya',
    icon: Shield,
    focus: 'Pertahanan Suci & Penyembuhan',
    desc: 'Ksatria suci bertameng tebal penahan serangan musuh, diperkuat berkah cahaya penyembuh dan aura perlindungan sekutu.',
    stats: { hp: 32, mana: 22, str: 15, dex: 10, con: 14, int: 10, wis: 13, cha: 15 },
    avatar: 'char_hero_01_paladin',
    starterItem: { id: 'item_08_dragon_shield', name: 'Dragon Shield', category: 'Perisai', effect: '+2 AC Pertahanan Suci', icon: 'item_08_dragon_shield' }
  }
];

const RACES = [
  { id: 'human', name: 'Human', trait: '+1 ke Seluruh Atribut' },
  { id: 'elf', name: 'High Elf', trait: 'Kepekaan Sihir & Imun Tidur' },
  { id: 'dwarf', name: 'Mountain Dwarf', trait: 'Ketahanan Racun & Pertahanan Baja' },
  { id: 'tiefling', name: 'Tiefling', trait: 'Resistensi Api & Daya Sihir' },
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
    <FantasyModal
      isOpen={isOpen}
      onClose={onClose}
      title="Berkas Petualang (Character Dossier)"
      subtitle={`Modul: ${campaign?.title || 'Petualangan Aether'}`}
      icon={Shield}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Heritage Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="char-name-input" className="block font-cinzel text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Nama Lengkap Petualang
            </label>
            <div className="relative">
              <input
                id="char-name-input"
                type="text"
                required
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-900 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors disabled:opacity-50 min-h-[44px]"
                placeholder="cth: Alden Stormcaller"
              />
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-cinzel text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Asal Ras (Heritage)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {RACES.map((r) => {
                const isSelected = selectedRace.id === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => handleSelectRace(r)}
                    disabled={isLoading}
                    className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all text-center truncate min-h-[44px] cursor-pointer disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm font-semibold'
                        : 'bg-slate-900/80 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Archetype Class Selector - 4 Primary Roles */}
        <div className="space-y-2.5">
          <label className="block font-cinzel text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Pilih Peran Kelas Petualang (D&amp;D 5E Archetype)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CLASSES.map((cls) => {
              const Icon = cls.icon;
              const isSelected = selectedClass.id === cls.id;
              return (
                <button
                  type="button"
                  key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  disabled={isLoading}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer relative flex flex-col items-center justify-between min-h-[160px] disabled:cursor-not-allowed ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-900/90'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 mb-2 bg-slate-950">
                    <img
                      src={`/assets/portraits/${cls.avatar}.png`}
                      alt={cls.name}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.target.src = '/assets/portraits/char_hero_01_paladin.png'; }}
                    />
                  </div>

                  <div className="w-full">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-cinzel text-sm font-bold text-white tracking-wide">
                        {cls.name}
                      </span>
                    </div>

                    <span className="text-[10px] text-amber-300/80 font-mono block mb-2">
                      {cls.focus}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-xs w-full pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1 text-rose-400 font-mono font-semibold">
                      <Heart className="w-3 h-3 fill-rose-500" /> {cls.stats.hp} HP
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400 font-mono font-semibold">
                      <Sparkles className="w-3 h-3" /> {cls.stats.mana} MP
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Dossier Preview */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-white/5 flex flex-col md:flex-row items-center gap-5">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border border-amber-400/50 shadow-md shrink-0 bg-slate-950">
            <img
              src={`/assets/portraits/${selectedClass.avatar}.png`}
              alt={selectedClass.name}
              className="w-full h-full object-cover object-top"
              onError={(e) => { e.target.src = '/assets/portraits/char_hero_01_paladin.png'; }}
            />
          </div>

          <div className="flex-1 w-full text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h3 className="font-cinzel text-base sm:text-lg font-bold text-white">
                {name || 'Tanpa Nama'}
              </h3>
              <FantasyBadge variant="gold" size="sm">
                {selectedRace.name} {selectedClass.name}
              </FantasyBadge>
            </div>

            <p className="text-xs text-slate-300 font-light leading-relaxed">
              {selectedClass.desc}
            </p>

            {/* Starter Equipment Note */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-amber-300 font-mono pt-1">
              <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Perlengkapan Awal: {selectedClass.starterItem.name} ({selectedClass.starterItem.effect})</span>
            </div>

            {/* D&D 5E Stat Attributes Matrix */}
            <div className="pt-2 grid grid-cols-6 gap-2 text-center font-mono">
              {Object.entries(selectedClass.stats).slice(2).map(([stat, val]) => (
                <div key={stat} className="bg-slate-950/80 border border-white/5 rounded-lg p-1.5">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">{stat}</span>
                  <span className="font-cinzel font-bold text-sm text-white">{val}</span>
                  <span className="block text-[10px] text-amber-400">{calculateMod(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/5">
          <FantasyButton
            variant="outline"
            size="md"
            disabled={isLoading}
            onClick={onClose}
          >
            Batal
          </FantasyButton>

          <FantasyButton
            type="submit"
            variant="primary"
            size="md"
            icon={Check}
            sound="select"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Mempersiapkan Petualangan...' : 'Konfirmasi Berkas & Mulai'}
          </FantasyButton>
        </div>
      </form>
    </FantasyModal>
  );
}
