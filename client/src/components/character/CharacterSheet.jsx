import React, { useState } from 'react';
import { EquipmentSlots } from './EquipmentSlots';
import { InventoryManager } from '../inventory/InventoryManager';
import { SpellbookManager } from '../spells/SpellbookManager';
import { ConditionTracker } from './ConditionTracker';
import { Shield, Heart, Zap, Sparkles, Sword, Award, Trash2, ArrowLeft, Layers, BookOpen, Package } from 'lucide-react';

export const CharacterSheet = ({ character, onBack, onUpdate, onDelete, onQuickRoll }) => {
  const [currentHp, setCurrentHp] = useState(character.currentHp);
  const [tempHp, setTempHp] = useState(character.tempHp || 0);
  const [hpInput, setHpInput] = useState('');
  const [levelUpLoading, setLevelUpLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'spells'

  const calcMod = (score) => Math.floor((score - 10) / 2);
  const formatMod = (score) => {
    const mod = calcMod(score);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleHpAction = async (type) => {
    const amount = parseInt(hpInput, 10);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const res = await fetch(`/api/characters/${character.id}/hp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentHp(data.data.currentHp);
        setTempHp(data.data.tempHp);
        setHpInput('');
        if (onUpdate) onUpdate({ ...character, currentHp: data.data.currentHp, tempHp: data.data.tempHp });
      }
    } catch (err) {
      console.error('Gagal memperbarui HP', err);
    }
  };

  const handleLevelUp = async () => {
    setLevelUpLoading(true);
    try {
      const res = await fetch(`/api/characters/${character.id}/levelup`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Selamat! ${character.name} naik ke Tingkat (Level) ${data.data.level}!`);
        if (onUpdate) onUpdate(data.data);
      }
    } catch (err) {
      console.error('Gagal level up', err);
    } finally {
      setLevelUpLoading(false);
    }
  };

  const handleEquipToggle = async (item, slot, action) => {
    try {
      const res = await fetch(`/api/characters/${character.id}/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, slot, action }),
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdate) onUpdate(data.data);
      }
    } catch (err) {
      console.error('Gagal equip item', err);
    }
  };

  const handleCastSpell = async (spell) => {
    try {
      const res = await fetch(`/api/characters/${character.id}/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spellId: spell.id, level: spell.level }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Mantra ${spell.name} berhasil dirapalkan!`);
        if (onUpdate) onUpdate({ ...character, spellSlots: data.data.spellSlots });
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Gagal rapalkan mantra', err);
    }
  };

  const handleToggleCondition = async (condition) => {
    try {
      const res = await fetch(`/api/characters/${character.id}/condition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition }),
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdate) onUpdate({ ...character, conditions: data.data.conditions });
      }
    } catch (err) {
      console.error('Gagal update kondisi', err);
    }
  };

  const abilityList = [
    { key: 'strength', name: 'Strength (Kekuatan)', abbr: 'STR', val: character.strength },
    { key: 'dexterity', name: 'Dexterity (Kelincahan)', abbr: 'DEX', val: character.dexterity },
    { key: 'constitution', name: 'Constitution (Daya Tahan)', abbr: 'CON', val: character.constitution },
    { key: 'intelligence', name: 'Intelligence (Kecerdasan)', abbr: 'INT', val: character.intelligence },
    { key: 'wisdom', name: 'Wisdom (Kebijaksanaan)', abbr: 'WIS', val: character.wisdom },
    { key: 'charisma', name: 'Charisma (Kharisma)', abbr: 'CHA', val: character.charisma },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Header */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-cinzel font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
        >
          <ArrowLeft size={16} /> Daftar Pahlawan
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLevelUp}
            disabled={levelUpLoading}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-cinzel font-bold text-xs uppercase px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Sparkles size={16} /> {levelUpLoading ? 'Meningkatkan...' : `Naik Level (${character.level + 1})`}
          </button>
          <button
            type="button"
            onClick={() => onDelete(character.id)}
            className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 p-2.5 rounded-xl border border-rose-800/60 transition-all"
            title="Hapus Karakter"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-4 py-3 rounded-xl text-center font-bold text-sm shadow-md animate-pulse">
          ✨ {message}
        </div>
      )}

      {/* Main Hero Header Card */}
      <div className="glass-card rounded-2xl p-6 border border-fantasy-border shadow-xl flex flex-wrap gap-6 items-center">
        <img
          src={character.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${character.name}`}
          alt={character.name}
          className="w-20 h-20 rounded-xl border-2 border-fantasy-gold bg-slate-900 shadow-md object-cover"
        />

        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-3">
            <h1 className="font-cinzel text-fantasy-gold text-2xl font-black">{character.name}</h1>
            <span className="bg-fantasy-gold/15 border border-fantasy-gold/50 text-fantasy-gold text-xs font-bold px-2.5 py-0.5 rounded-md">
              LVL {character.level}
            </span>
          </div>
          <div className="text-slate-400 text-sm mt-0.5">
            {character.race} {character.characterClass} • {character.background} • {character.alignment}
          </div>
          {character.bio && (
            <p className="text-slate-400 text-xs italic mt-2 line-clamp-2">
              "{character.bio}"
            </p>
          )}
        </div>

        {/* Core Vitals Badges (With Dynamic AC & Speed Sync) */}
        <div className="flex gap-3">
          <div className="text-center bg-sky-950/40 border border-sky-600/40 rounded-xl px-4 py-2">
            <div className="text-[10px] text-sky-300 font-bold uppercase flex items-center justify-center gap-1">
              <Shield size={12} /> ARMOR (AC)
            </div>
            <div className="text-xl font-black font-cinzel text-sky-300 mt-0.5">
              {character.armorClass}
            </div>
          </div>

          <div className="text-center bg-emerald-950/40 border border-emerald-600/40 rounded-xl px-4 py-2">
            <div className="text-[10px] text-emerald-300 font-bold uppercase flex items-center justify-center gap-1">
              <Zap size={12} /> KECEPATAN
            </div>
            <div className="text-xl font-black font-cinzel text-emerald-300 mt-0.5">
              {character.speed}ft
            </div>
          </div>

          <div className="text-center bg-amber-950/40 border border-amber-600/40 rounded-xl px-4 py-2">
            <div className="text-[10px] text-fantasy-gold font-bold uppercase flex items-center justify-center gap-1">
              <Award size={12} /> PROFISIENSI
            </div>
            <div className="text-xl font-black font-cinzel text-amber-300 mt-0.5">
              +{character.proficiencyBonus || 2}
            </div>
          </div>
        </div>
      </div>

      {/* Conditions & Buffs Tracker */}
      <ConditionTracker
        conditions={character.conditions || []}
        onToggleCondition={handleToggleCondition}
      />

      {/* Grid Split: Abilities & Live HP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Ability Scores */}
        <div className="glass-card rounded-2xl p-5 border border-fantasy-border">
          <h3 className="font-cinzel text-fantasy-gold font-bold text-base mb-4 flex items-center gap-2">
            <Sword size={18} /> Atribut & Lemparan Dadu Cepat
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {abilityList.map((ab) => (
              <div
                key={ab.key}
                onClick={() => {
                  if (onQuickRoll) {
                    onQuickRoll({
                      type: ab.name.split(' (')[0],
                      mod: calcMod(ab.val),
                    });
                  }
                }}
                className="bg-slate-900/80 border border-slate-800 hover:border-fantasy-gold/50 rounded-xl p-3 flex justify-between items-center cursor-pointer transition-all hover:bg-slate-800/60"
                title={`Klik untuk lempar dadu ability check ${ab.name} (${formatMod(ab.val)})`}
              >
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">{ab.abbr}</div>
                  <div className="text-xs font-semibold text-slate-200">{ab.name.split(' (')[0]}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black font-cinzel text-fantasy-gold">
                    {formatMod(ab.val)}
                  </div>
                  <div className="text-[10px] text-slate-500">Skor: {ab.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live HP */}
        <div className="glass-card rounded-2xl p-5 border border-fantasy-border">
          <h3 className="font-cinzel text-rose-400 font-bold text-base mb-4 flex items-center gap-2">
            <Heart size={18} /> Kondisi Darah (Live HP Tracker)
          </h3>

          <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-xs text-slate-400 font-medium">Kesehatan Saat Ini</span>
              <span className={`text-base font-black font-cinzel ${currentHp <= 3 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {currentHp} / {character.maxHp} HP {tempHp > 0 && <small className="text-sky-400">(+{tempHp} Temp)</small>}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  currentHp <= 3 ? 'bg-gradient-to-r from-rose-700 to-rose-500' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, (currentHp / character.maxHp) * 100))}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={hpInput}
              onChange={(e) => setHpInput(e.target.value)}
              placeholder="Jumlah..."
              className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 text-sm text-center focus:outline-none focus:border-fantasy-gold"
            />
            <button
              type="button"
              onClick={() => handleHpAction('damage')}
              className="flex-1 bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-cinzel font-bold text-xs uppercase py-2 rounded-xl border border-rose-800/60 transition-all"
            >
              Damage (Terluka)
            </button>
            <button
              type="button"
              onClick={() => handleHpAction('heal')}
              className="flex-1 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 font-cinzel font-bold text-xs uppercase py-2 rounded-xl border border-emerald-800/60 transition-all"
            >
              Heal (Sembuh)
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Slots Section */}
      <EquipmentSlots
        character={character}
        onEquipToggle={handleEquipToggle}
      />

      {/* Tab Switcher: Inventory vs Spellbook */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-800 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`font-cinzel font-bold text-xs uppercase pb-2 flex items-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'inventory'
                ? 'border-fantasy-gold text-fantasy-gold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package size={15} /> Tas Inventaris ({character.inventory?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spells')}
            className={`font-cinzel font-bold text-xs uppercase pb-2 flex items-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'spells'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen size={15} /> Buku Mantra ({character.spells?.length || 0})
          </button>
        </div>

        {activeTab === 'inventory' ? (
          <InventoryManager
            inventory={character.inventory || []}
            onEquipItem={handleEquipToggle}
            gold={character.gold || 0}
          />
        ) : (
          <SpellbookManager
            spells={character.spells || []}
            spellSlots={character.spellSlots || {}}
            onCastSpell={handleCastSpell}
          />
        )}
      </div>
    </div>
  );
};
