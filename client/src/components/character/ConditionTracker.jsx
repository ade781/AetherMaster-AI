import React from 'react';
import { Activity, Plus, X } from 'lucide-react';

export const ConditionTracker = ({ conditions = [], onToggleCondition }) => {
  const PRESET_CONDITIONS = [
    { id: 'blessed', name: 'Diberkati (Blessed)', type: 'buff', icon: '✨', desc: '+1d4 roll' },
    { id: 'poisoned', name: 'Teracuni (Poisoned)', type: 'debuff', icon: '🧪', desc: 'Disadvantage' },
    { id: 'inspired', name: 'Inspirasi Heroik', type: 'buff', icon: '🔥', desc: 'Reroll 1 Dadu' },
    { id: 'blinded', name: 'Kebutaan (Blinded)', type: 'debuff', icon: '👁️', desc: 'Serangan Lemah' },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5">
          <Activity size={16} /> Status & Kondisi Karakter
        </h4>
        <span className="text-[10px] text-slate-400">Klik untuk mengaktifkan status</span>
      </div>

      {/* Active Badges */}
      <div className="flex flex-wrap gap-2">
        {PRESET_CONDITIONS.map((cond) => {
          const isActive = conditions.some((c) => c.id === cond.id);
          return (
            <button
              key={cond.id}
              type="button"
              onClick={() => onToggleCondition(cond)}
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                isActive
                  ? cond.type === 'buff'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-sm'
                    : 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{cond.icon}</span>
              <span className="font-semibold">{cond.name.split(' (')[0]}</span>
              <span className="text-[10px] opacity-75">({cond.desc})</span>
              {isActive && <X size={12} className="ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
