import React from 'react';
import { Play, Sparkles } from 'lucide-react';
import FantasyBadge from '../common/FantasyBadge';
import FantasyButton from '../common/FantasyButton';
import audio from '../../services/audioService';

export default function CampaignCard({
  campaign,
  isSelected = false,
  onSelect,
  onStart
}) {
  if (!campaign) return null;

  const getCoverSrc = () => {
    if (campaign.coverImage && (campaign.coverImage.startsWith('http') || campaign.coverImage.startsWith('/') || campaign.coverImage.startsWith('data:'))) {
      return campaign.coverImage;
    }
    if (campaign.defaultBackgroundId) {
      if (campaign.defaultBackgroundId.startsWith('http') || campaign.defaultBackgroundId.startsWith('/')) {
        return campaign.defaultBackgroundId;
      }
      return `/assets/backgrounds/${campaign.defaultBackgroundId.replace(/\.png$/i, '')}.png`;
    }
    return '/assets/backgrounds/bg_01_tavern.png';
  };

  const getGenreVariant = (genre) => {
    const g = String(genre || '').toLowerCase();
    if (g.includes('gothic') || g.includes('horror') || g.includes('blood')) return 'crimson';
    if (g.includes('eldritch') || g.includes('ocean') || g.includes('abyss')) return 'cyan';
    if (g.includes('survival') || g.includes('wild')) return 'emerald';
    return 'gold';
  };

  const threatLevel = campaign.threatLevel || 'Tier 1 (Level 1-3)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        audio.playClick();
        onSelect(campaign);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          audio.playClick();
          onSelect(campaign);
        }
      }}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 flex flex-col justify-between select-none ${
        isSelected
          ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.01]'
          : 'bg-slate-950/80 border-white/10 hover:border-white/20 hover:bg-slate-900/60'
      }`}
    >
      {/* Top Image Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-950">
        <img
          src={getCoverSrc()}
          alt={campaign.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            if (!e.target.src.endsWith('/assets/backgrounds/bg_01_tavern.png')) {
              e.target.src = '/assets/backgrounds/bg_01_tavern.png';
            }
          }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Badges on Top */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <FantasyBadge variant={getGenreVariant(campaign.genre)} size="sm">
            {String(campaign.genre || 'Dark Fantasy').replace(/_/g, ' ')}
          </FantasyBadge>
          <FantasyBadge variant="neutral" size="sm">
            {threatLevel}
          </FantasyBadge>
        </div>

        {/* Campaign Icon */}
        <div className="absolute -bottom-4 left-4 w-11 h-11 rounded-xl bg-slate-950 border border-amber-400/50 p-1 flex items-center justify-center text-xl shadow-lg backdrop-blur-md">
          {campaign.icon && campaign.icon.length <= 4 ? (
            <span>{campaign.icon}</span>
          ) : (
            <Sparkles className="w-5 h-5 text-amber-400" />
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 pt-6 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <h3 className="font-cinzel text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
            {campaign.title}
          </h3>
          <p className="text-xs text-slate-300 font-light leading-relaxed line-clamp-2">
            {campaign.premise}
          </p>
        </div>

        {/* Action Bottom Row */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {campaign.primarySkill ? `Uji: ${campaign.primarySkill}` : 'Sistem D&D 5E'}
          </span>

          <FantasyButton
            variant={isSelected ? 'primary' : 'secondary'}
            size="sm"
            icon={Play}
            sound="select"
            onClick={(e) => {
              e.stopPropagation();
              onStart(campaign);
            }}
          >
            Pilih
          </FantasyButton>
        </div>
      </div>
    </div>
  );
}
