import React from 'react';
import { Play, Sparkles } from 'lucide-react';
import audio from '../../services/audioService';

export default function CampaignCard({
  campaign,
  isSelected = false,
  onSelect,
  onStart
}) {
  if (!campaign) return null;

  const getCoverSrc = () => {
    if (campaign.defaultBackgroundId) return `/assets/backgrounds/${campaign.defaultBackgroundId}.png`;
    if (campaign.coverImage) return campaign.coverImage;
    return '/assets/backgrounds/bg_01_tavern.png';
  };

  const getGenreColor = (genre) => {
    const g = String(genre || '').toLowerCase();
    if (g.includes('gothic') || g.includes('horror') || g.includes('blood')) {
      return 'bg-rose-950/80 border-rose-500/50 text-rose-300';
    }
    if (g.includes('eldritch') || g.includes('ocean') || g.includes('abyss')) {
      return 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300';
    }
    if (g.includes('arcana') || g.includes('magic')) {
      return 'bg-purple-950/80 border-purple-500/50 text-purple-300';
    }
    if (g.includes('survival') || g.includes('wild')) {
      return 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
    }
    return 'bg-amber-950/80 border-amber-500/50 text-amber-300';
  };

  const threatLevel = campaign.threatLevel || 'Tier 1 (Level 1-3)';

  return (
    <div
      onClick={() => {
        audio.playClick();
        onSelect(campaign);
      }}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 flex flex-col justify-between ${isSelected
          ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
          : 'bg-slate-950/80 border-slate-800 hover:border-slate-600 hover:bg-slate-900/60'
        }`}
    >
      {/* Top Image Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-950">
        <img
          src={getCoverSrc()}
          alt={campaign.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            if (campaign.defaultBackgroundId && !e.target.src.includes(campaign.defaultBackgroundId)) {
              e.target.src = `/assets/backgrounds/${campaign.defaultBackgroundId}.png`;
            } else {
              e.target.src = '/assets/backgrounds/bg_01_tavern.png';
            }
          }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Badges on Top */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md ${getGenreColor(campaign.genre)}`}>
            {String(campaign.genre || 'Dark Fantasy').replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-slate-300 backdrop-blur-md">
            {threatLevel}
          </span>
        </div>

        {/* Campaign Icon */}
        <div className="absolute -bottom-4 left-4 w-11 h-11 rounded-xl bg-slate-950 border border-amber-400/60 p-1 flex items-center justify-center text-xl shadow-lg backdrop-blur-md">
          {campaign.icon && campaign.icon.length <= 4 ? (
            <span>{campaign.icon}</span>
          ) : (
            <Sparkles className="w-5 h-5 text-amber-400" />
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 pt-6 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-cinzel text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
            {campaign.title}
          </h3>
          <p className="text-xs text-slate-300 font-light leading-relaxed line-clamp-2">
            {campaign.premise}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {campaign.primarySkill ? `Uji: ${campaign.primarySkill}` : 'Sistem D&D 5E'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              audio.playSelect();
              onStart(campaign);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-semibold font-cinzel transition-all flex items-center gap-1.5 min-h-[36px]"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Pilih</span>
          </button>
        </div>
      </div>
    </div>
  );
}
