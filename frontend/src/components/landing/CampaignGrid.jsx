import React, { useState, useMemo, useEffect } from 'react';
import { Search, Compass, Play, Shuffle } from 'lucide-react';
import CampaignCard from './CampaignCard';
import FantasyButton from '../common/FantasyButton';
import FantasyBadge from '../common/FantasyBadge';
import audio from '../../services/audioService';

export default function CampaignGrid({
  campaigns = [],
  initLoading = false,
  onSelectCampaign
}) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Randomize initial selection on mount or when campaigns load
  useEffect(() => {
    if (campaigns && campaigns.length > 0 && !selectedCampaignId) {
      const randomIndex = Math.floor(Math.random() * campaigns.length);
      setSelectedCampaignId(campaigns[randomIndex].id);
    }
  }, [campaigns, selectedCampaignId]);

  // Shuffle to another random campaign
  const handleShuffleCampaign = () => {
    if (!campaigns || campaigns.length === 0) return;
    audio.playClick();
    const otherCampaigns = campaigns.filter(c => c.id !== activeCampaign?.id);
    const pool = otherCampaigns.length > 0 ? otherCampaigns : campaigns;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setSelectedCampaignId(pool[randomIndex].id);
  };

  // Extract unique genres dynamically
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
    <section id="campaigns" className="relative z-20 w-full py-16 px-6 md:px-12 bg-slate-950 border-t border-white/5">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs uppercase font-cinzel font-semibold tracking-widest text-amber-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              Arsip Kampanye Petualangan D&amp;D 5E
            </span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white tracking-tight">
              Pilih Dunia &amp; Tentukan Takdir
            </h2>
            <p className="text-xs md:text-sm text-slate-400 font-light leading-relaxed">
              Tersedia <span className="text-amber-300 font-semibold">{campaigns.length} modul petualangan</span>. Pilih atau acak modul untuk melihat berkas intelijen taktis.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul atau premis..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors min-h-[44px]"
            />
          </div>
        </div>

        {/* Genre Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {genres.map(g => (
            <button
              type="button"
              key={g}
              onClick={() => {
                audio.playClick();
                setSelectedGenre(g);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-cinzel font-semibold whitespace-nowrap transition-all border min-h-[44px] cursor-pointer ${
                selectedGenre === g
                  ? 'bg-amber-500/15 border-amber-400/60 text-amber-300 shadow-sm'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {formatGenreLabel(g)} {g === 'all' && `(${campaigns.length})`}
            </button>
          ))}
        </div>

        {/* Active Featured Campaign Dossier (if active campaign selected) */}
        {activeCampaign && (
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Visual Cover (5 cols) */}
            <div className="lg:col-span-5 relative h-64 lg:h-auto min-h-[220px] overflow-hidden bg-slate-950">
              <img
                src={activeCampaign.coverImage || (activeCampaign.defaultBackgroundId ? `/assets/backgrounds/${activeCampaign.defaultBackgroundId.replace(/\.png$/i, '')}.png` : '/assets/backgrounds/bg_01_tavern.png')}
                alt={activeCampaign.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/assets/backgrounds/bg_01_tavern.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
              <div className="absolute top-4 left-4">
                <FantasyBadge variant="gold" size="sm">
                  {String(activeCampaign.genre || 'Dark Fantasy').replace(/_/g, ' ')}
                </FantasyBadge>
              </div>
            </div>

            {/* Intel Details (7 cols) */}
            <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeCampaign.icon || '⚔️'}</span>
                    <span className="text-xs font-mono text-amber-400">Modul Terpilih</span>
                  </div>
                  <FantasyButton
                    variant="outline"
                    size="sm"
                    icon={Shuffle}
                    onClick={handleShuffleCampaign}
                    title="Pilih misi acak lain"
                  >
                    Acak Misi
                  </FantasyButton>
                </div>

                <h3 className="font-cinzel text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {activeCampaign.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-300 font-light leading-relaxed">
                  {activeCampaign.premise}
                </p>

                {activeCampaign.introDialogue && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border-l-4 border-amber-400 text-xs text-amber-200/90 italic font-light leading-relaxed">
                    "{activeCampaign.introDialogue}"
                  </div>
                )}
              </div>

              {/* Action Bottom Row */}
              <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div className="text-[11px] text-slate-400 font-mono">
                  <span>{activeCampaign.threatLevel || 'Tier 1 (Level 1-3)'}</span>
                  {activeCampaign.primarySkill && <span> • Uji: {activeCampaign.primarySkill}</span>}
                </div>

                <FantasyButton
                  variant="primary"
                  size="md"
                  icon={Play}
                  sound="select"
                  onClick={() => onSelectCampaign(activeCampaign)}
                >
                  Mulai Ekspedisi Ini
                </FantasyButton>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-cinzel text-lg font-bold text-white">
              Semua Modul Terdaftar ({filteredCampaigns.length})
            </h3>
            {searchQuery && (
              <span className="text-xs text-slate-400 font-mono">
                Hasil pencarian untuk "{searchQuery}"
              </span>
            )}
          </div>

          {initLoading ? (
            <div className="py-20 text-center text-xs font-cinzel text-slate-400">
              Memuat modul petualangan dari basis data...
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 border border-white/5 rounded-2xl bg-slate-900/40">
              Tidak ada modul petualangan yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map(camp => (
                <CampaignCard
                  key={camp.id}
                  campaign={camp}
                  isSelected={activeCampaign?.id === camp.id}
                  onSelect={(c) => setSelectedCampaignId(c.id)}
                  onStart={(c) => onSelectCampaign(c)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
