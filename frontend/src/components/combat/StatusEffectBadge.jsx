import React, { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  Zap,
  Sparkles,
  Shield,
  Skull,
  Activity
} from 'lucide-react';
import { STATUS_EFFECTS_MAP } from '../../utils/statusEffects';

export { STATUS_EFFECTS_MAP };

const ICONS_LOOKUP = {
  Zap,
  Skull,
  Sparkles,
  Shield,
  Flame,
  Activity,
  ShieldAlert
};

export default function StatusEffectBadge({ effectId, duration }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const cleanId = String(effectId).toLowerCase();
  const config = STATUS_EFFECTS_MAP[cleanId] || {
    label: effectId,
    description: 'Efek status taktis aktif.',
    icon: ShieldAlert,
    color: 'slate'
  };

  const IconComp = ICONS_LOOKUP[config.iconName] || ShieldAlert;

  const colorClasses = {
    amber: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    emerald: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    gold: 'bg-amber-400/20 border-amber-400/40 text-amber-300',
    cyan: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
    rose: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
    purple: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    slate: 'bg-slate-500/20 border-slate-500/40 text-slate-300'
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(prev => !prev)}
    >
      <div
        className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold flex items-center gap-1 cursor-help transition-all shadow-sm ${
          colorClasses[config.color] || colorClasses.slate
        }`}
      >
        <IconComp className="w-3 h-3" />
        <span>{config.label}</span>
        {duration && (
          <span className="opacity-75 text-[9px]">({duration}r)</span>
        )}
      </div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 rounded-xl bg-slate-950/95 border border-white/20 text-slate-200 text-[11px] shadow-2xl backdrop-blur-md animate-fadeIn pointer-events-none">
          <div className="font-cinzel font-bold text-white mb-0.5 flex items-center gap-1">
            <IconComp className="w-3 h-3 text-amber-400" />
            <span>{config.label}</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-tight">
            {config.description}
          </p>
        </div>
      )}
    </div>
  );
}
