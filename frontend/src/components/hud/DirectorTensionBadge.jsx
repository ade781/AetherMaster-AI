import React, { useState } from 'react';
import { Compass, AlertTriangle, Flame, Activity } from 'lucide-react';

export default function DirectorTensionBadge({
  tension = 3,
  inCombat = false,
  mood = 'tenang'
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Derive normalized tension score (1 to 10)
  let score = typeof tension === 'number' ? tension : 3;
  if (inCombat) score = Math.max(score, 8);
  if (mood === 'menegangkan' || mood === 'kritis') score = Math.max(score, 7);

  // Tier categorization
  let tier = 'low';
  let label = 'Eksplorasi Aman';
  let badgeColor = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
  let dotColor = 'bg-emerald-400';
  let IconComp = Compass;
  let description = 'Tensi AI Director berada pada fase santai; karakter dapat mengeksplorasi dan berinteraksi tanpa tekanan bahaya langsung.';

  if (score >= 8 || inCombat) {
    tier = 'high';
    label = 'Pertempuran Genting';
    badgeColor = 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse';
    dotColor = 'bg-rose-400';
    IconComp = Flame;
    description = 'Tensi berada pada titik kritis; keputusan taktis memiliki konsekuensi mematikan dan musuh aktif menyerang.';
  } else if (score >= 4) {
    tier = 'medium';
    label = 'Tensi Meningkat';
    badgeColor = 'bg-amber-500/15 border-amber-500/30 text-amber-300';
    dotColor = 'bg-amber-400';
    IconComp = AlertTriangle;
    description = 'Ancaman mendekat; kewaspadaan meningkat terhadap jebakan, intrik, dan potensi sergapan.';
  }

  return (
    <div
      className="relative inline-block select-none"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(prev => !prev)}
    >
      <div
        className={`px-2.5 py-1 rounded-full border text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${badgeColor}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <IconComp className="w-3 h-3" />
        <span className="font-cinzel font-bold tracking-wider uppercase hidden sm:inline">
          {label}
        </span>
        <span className="font-bold sm:hidden">
          {tier === 'high' ? 'Genting' : tier === 'medium' ? 'Waspada' : 'Aman'}
        </span>
        <span className="opacity-70 text-[9px]">({score}/10)</span>
      </div>

      {showTooltip && (
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1.5 w-52 p-2.5 rounded-xl bg-slate-950/95 border border-white/15 text-slate-200 text-[11px] shadow-2xl backdrop-blur-md animate-fadeIn pointer-events-none">
          <div className="font-cinzel font-bold text-white mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Director Pacing</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed font-outfit">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}
