import React from 'react';
import { Sparkles, Wand2, Zap, Flame, Shield } from 'lucide-react';

export const SpellbookManager = ({ spells = [], spellSlots = {}, onCastSpell }) => {
  const level1 = spellSlots.level1 || { max: 2, current: 2 };
  const level2 = spellSlots.level2 || { max: 0, current: 0 };

  return (
    <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
      {/* Header & Spell Slots Tracker */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h4 className="font-cinzel text-purple-300 font-bold text-sm flex items-center gap-1.5">
          <Wand2 size={16} /> Buku Mantra (Spellbook)
        </h4>

        {/* Slot tracker pills */}
        <div className="flex gap-2">
          <div className="bg-slate-900 px-3 py-1 rounded-xl border border-purple-900/60 text-xs flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Slot Lv 1:</span>
            <span className="font-bold text-purple-300">{level1.current} / {level1.max}</span>
          </div>
          {level2.max > 0 && (
            <div className="bg-slate-900 px-3 py-1 rounded-xl border border-purple-900/60 text-xs flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Slot Lv 2:</span>
              <span className="font-bold text-purple-300">{level2.current} / {level2.max}</span>
            </div>
          )}
        </div>
      </div>

      {/* Spell list cards */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {spells.map((spell) => (
          <div
            key={spell.id}
            className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 hover:border-purple-500/50 transition-all flex justify-between items-center"
          >
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-200">{spell.name}</span>
                <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                  {spell.level === 0 ? 'Cantrip' : `Tingkat ${spell.level}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{spell.desc}</p>
            </div>

            <button
              type="button"
              onClick={() => onCastSpell(spell)}
              disabled={spell.level > 0 && level1.current <= 0}
              className="text-xs bg-purple-900/40 hover:bg-purple-800 text-purple-200 font-cinzel font-bold px-3 py-1.5 rounded-lg border border-purple-700/60 flex items-center gap-1 transition-all disabled:opacity-40"
            >
              <Sparkles size={13} /> Rapalkan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
