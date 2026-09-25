import React, { useState, useMemo } from 'react';
import { Search, Compass, RefreshCw, Play } from 'lucide-react';
import CampaignCard from './CampaignCard';
import audio from '../../services/audioService';

export default function CampaignGrid({
  campaigns = [],
  initLoading = false,
  onSelectCampaign
}) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique genres dynamically or fallback to preset list
  const genres = useMemo(() => {
    const set = new Set();
    campaigns.forEach(c => {
      if (c.genre) set.add(c.genre);
    });
    return ['all', ...Array.from(set)];
  }, [campaigns]);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchGenre = selectedGenre === 'all' || (c.genre && c.genre.toLowerCase() === selectedGenre.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (c.title && c.title.toLowerCase().includes(q)) || (c.premise && c.premise.toLowerCase().includes(q));
      return matchGenre && matchQuery;
    });
  }, [campaigns, selectedGenre, searchQuery]);

  const activeCampaign = useMemo(() => {
    if (selectedCampaignId) {
      return campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];
    }
    return campaigns[0] || null;
  }, [campaigns, selectedCampaignId]);

  const formatGenreLabel = (g) => {
    if (g === 'all') return 'Semua';
    return g.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <section id="campaigns" className="relative z-20 w-full py-16 px-6 md:px-12 bg-slate-950 border-t border-slate-800/80">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs uppercase font-semibold tracking-widest text-amber-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              Arsip Kampanye Petualangan D&amp;D 5E
            </span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white tracking-tight">
              Pilih Dunia &amp; Tentukan Takdir
            </h2>
            <p className="text-xs md:text-sm text-slate-400 font-light leading-relaxed">
              Jelajahi dunia petualangan naratif dari basis data. Pilih modul untuk melihat berkas intelijen taktis.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul atau premis..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Genre Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {genres.map(g => (
            <button
              key={g}
              onClick={() => {
                audio.playClick();
                setSelectedGenre(g);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border min-h-[40px] ${
                selectedGenre === g
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {formatGenreLabel(g)} {g === 'all' && `(${campaigns.length})`}
            </button>
          ))}
        </div>

        {/* Active Featured Campaign Dossier (if active campaign selected) */}
        {activeCampaign && (
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl relative grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Visual Cover (5 cols) */}
            <div className="lg:col-span-5 relative h-64 lg:h-auto min-h-[220px] overflow-hidden bg-slate-950">
              <img
                src={(activeCampaign.defaultBackgroundId ? `/assets/backgrounds/${activeCampaign.defaultBackgroundId}.png` : activeCampaign.coverImage) || '/assets/backgrounds/bg_01_tavern.png'}
                alt={activeCampaign.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (activeCampaign.defaultBackgroundId && !e.target.src.includes(activeCampaign.defaultBackgroundId)) {
                    e.target.src = `/assets/backgrounds/${activeCampaign.defaultBackgroundId}.png`;
                  } else {
                    e.target.src = '/assets/backgrounds/bg_01_tavern.png';
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/70 border border-white/10 text-amber-300 backdrop-blur-md">
                  {String(activeCampaign.genre || 'Dark Fantasy').replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Intel Details (7 cols) */}
            <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activeCampaign.icon || '⚔️'}</span>
                  <span className="text-xs font-mono text-amber-400">Modul Terpilih</span>
                </div>
                <h3 className="font-cinzel text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {activeCampaign.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-300 font-light leading-relaxed">
                  {activeCampaign.premise}
                </p>
                {activeCampaign.introDialogue && (
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border-l-4 border-amber-400 text-xs text-amber-200/90 italic font-serif leading-relaxed">
                    "{activeCampaign.introDialogue}"
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="text-[11px] text-slate-400 font-mono">
                  <span>{activeCampaign.threatLevel || 'Tier 1'}</span>
                  {activeCampaign.primarySkill && <span> • Uji: {activeCampaign.primarySkill}</span>}
                </div>
                <button
                  onClick={() => {
                    audio.playSelect();
                    onSelectCampaign(activeCampaign);
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs tracking-wider shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 min-h-[44px]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Mulai Ekspedisi Ini</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Cards Grid */}
        {initLoading ? (
          <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-sm">Memuat arsip kampanye petualangan...</span>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            <p className="text-sm">Tidak ada kampanye yang cocok dengan filter pencarian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map(camp => (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                isSelected={activeCampaign?.id === camp.id}
                onSelect={(c) => setSelectedCampaignId(c.id)}
                onStart={onSelectCampaign}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
