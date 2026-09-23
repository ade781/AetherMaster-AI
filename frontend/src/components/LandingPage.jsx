import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Play, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronDown, 
  Shield, 
  Compass, 
  GitBranch, 
  Menu, 
  X,
  Scroll,
  Sword,
  Wand2
} from 'lucide-react';
import audio from '../services/audioService';

const CAMPAIGN_METADATA = {
  whispering_tavern: {
    bgImage: '/assets/bg_tavern.jpg',
    iconImage: '/assets/icons/icon_tavern.png',
    threatLevel: 'Tier 1 (Level 1-3)',
    threatBadge: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
    location: 'Kedai Oakhaven & Katakombe Bawah Tanah',
    encounter: 'Tikus Raksasa, Bandit Bayangan, Tengkorak Penjaga',
    environment: 'Penerangan Redup, Koridor Sempit, Jebakan Lantai',
    primarySkill: 'Persepsi & Investigasi',
    themeColor: 'amber',
    accentBorder: 'border-amber-500/70',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-300',
    dmQuote: '"Hangatnya api unggun kedai tak mampu mengusir hawa dingin yang merayap dari balik pintu ruang bawah tanah tua..."'
  },
  crypt_of_crimson: {
    bgImage: '/assets/bg_crypt.jpg',
    iconImage: '/assets/icons/icon_skull.png',
    threatLevel: 'Tier 2 (Level 3-5)',
    threatBadge: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
    location: 'Makam Bangsawan Kuno Malakor',
    encounter: 'Necromancer Malakor, Pasukan Kerangka, Spectre',
    environment: 'Kegelapan Abadi, Kabut Darah, Altar Necromancy',
    primarySkill: 'Arcana & Konstitusi',
    themeColor: 'rose',
    accentBorder: 'border-rose-500/70',
    accentBg: 'bg-rose-500/10',
    accentText: 'text-rose-300',
    dmQuote: '"Batu nisan retak membuka lorong tanpa dasar. Bau dupa pemakaman dan darah kering menusuk indra penciumanmu..."'
  },
  abyssal_citadel: {
    bgImage: '/assets/bg_sunken_citadel.jpg',
    iconImage: '/assets/icons/icon_wave.png',
    threatLevel: 'Tier 2 (Level 4-6)',
    threatBadge: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300',
    location: 'Kuil Samudra Bawah Air Sunken Citadel',
    encounter: 'Arwah Pelaut Karang, Abyssal Spawn, Penjaga Gurita',
    environment: 'Ruang Terendam, Tekanan Air, Teka-teki Rune Aether',
    primarySkill: 'Atletik & Kebijaksanaan',
    themeColor: 'cyan',
    accentBorder: 'border-cyan-500/70',
    accentBg: 'bg-cyan-500/10',
    accentText: 'text-cyan-300',
    dmQuote: '"Cahaya bioluminesensi menerangi pilar kuil yang tenggelam ribuan tahun. Air laut berbisik dalam pikiranmu..."'
  }
};

export default function LandingPage({
  campaigns = [],
  initLoading = false,
  onSelectCampaign,
  onOpenSaveLoad,
  showToast
}) {
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState('whispering_tavern');

  // Launch command displayed in the central glassmorphism pill
  const launchCommand = "npx aethermaster-ai";

  const handleCopyCommand = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigator.clipboard.writeText(launchCommand);
    setCopied(true);
    audio.playClick();
    if (showToast) showToast('Perintah npx disalin ke clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCampaignIcon = (camp) => {
    if (!camp) return '/assets/icons/icon_swords.png';
    if (camp.id === 'whispering_tavern' || camp.icon === '🍺') return '/assets/icons/icon_tavern.png';
    if (camp.id === 'crypt_of_crimson' || camp.icon === '💀' || camp.genre === 'gothic_horror') return '/assets/icons/icon_skull.png';
    if (camp.id === 'abyssal_citadel' || camp.icon === '🌊' || camp.genre === 'eldritch_mystery') return '/assets/icons/icon_wave.png';
    return '/assets/icons/icon_swords.png';
  };

  return (
    <div className="relative min-h-screen bg-fantasy-dark text-slate-100 flex flex-col font-outfit selection:bg-fantasy-gold selection:text-slate-950 overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 1. HERO VIEWPORT (Matching the clean, dramatic reference aesthetic)        */}
      {/* ========================================================================= */}
      <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden">
        
        {/* Background Image with Cinematic Scrim and Vignette */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transform scale-100 transition-transform duration-1000"
          style={{ backgroundImage: "url('/assets/hero_bg.jpg')" }}
        >
          {/* Top scrim for navbar readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/40 to-slate-950/95" />
          
          {/* Radial vignette for focus */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(9,10,15,0.75)_100%)]" />
        </div>

        {/* Top Navigation Bar */}
        <header className="relative z-30 w-full px-6 py-5 md:px-12 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <a 
              href="/" 
              className="group flex items-center gap-2.5 text-slate-100 hover:text-fantasy-gold transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-fantasy-gold/40 flex items-center justify-center p-1 shadow-sm group-hover:border-fantasy-gold transition-colors">
                <img 
                  src="/assets/icons/icon_swords.png" 
                  alt="AetherMaster Swords" 
                  className="w-full h-full object-contain rounded"
                />
              </div>
              <span className="font-cinzel text-base md:text-lg font-bold tracking-wide text-white group-hover:text-fantasy-gold transition-colors">
                /aethermaster
              </span>
            </a>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <button 
              onClick={() => scrollToSection('campaigns')}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              Kampanye
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            <button 
              onClick={() => setActiveModal('rules')}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              Sistem 5E
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            <button 
              onClick={() => setActiveModal('guide')}
              className="hover:text-white transition-colors"
            >
              Panduan
            </button>

            <button 
              onClick={() => setActiveModal('roadmap')}
              className="hover:text-white transition-colors"
            >
              Roadmap
            </button>

            <button 
              onClick={() => setActiveModal('icons')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:text-white hover:border-amber-400 transition-colors"
            >
              <img src="/assets/icons/icon_swords.png" alt="Aset" className="w-3.5 h-3.5 object-contain" />
              <span>Aset 3x3</span>
            </button>

            <a 
              href="https://github.com/ade781/AetherMaster-AI" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              GitHub
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </nav>

          {/* Top Right Action Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenSaveLoad}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg"
            >
              <BookOpen className="w-3.5 h-3.5 text-fantasy-gold" />
              Muat Save Game
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden relative z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl px-6 py-5 flex flex-col gap-4 text-sm animate-fadeIn">
            <button 
              onClick={() => scrollToSection('campaigns')}
              className="text-left py-2 font-medium text-slate-200 hover:text-fantasy-gold"
            >
              Pilih Kampanye
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); setActiveModal('rules'); }}
              className="text-left py-2 font-medium text-slate-200 hover:text-fantasy-gold"
            >
              Sistem Aturan D&D 5E
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); setActiveModal('guide'); }}
              className="text-left py-2 font-medium text-slate-200 hover:text-fantasy-gold"
            >
              Panduan Bermain
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); setActiveModal('roadmap'); }}
              className="text-left py-2 font-medium text-slate-200 hover:text-fantasy-gold"
            >
              Roadmap Pengembangan
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); setActiveModal('icons'); }}
              className="text-left py-2 font-medium text-amber-300 hover:text-white flex items-center gap-2"
            >
              <img src="/assets/icons/icon_swords.png" alt="Aset" className="w-4 h-4 object-contain" />
              <span>Galeri Aset Ikon 3x3</span>
            </button>
            <a 
              href="https://github.com/ade781/AetherMaster-AI" 
              target="_blank" 
              rel="noreferrer"
              className="py-2 flex items-center justify-between text-slate-200 hover:text-fantasy-gold"
            >
              <span>Repositori GitHub</span>
              <ExternalLink className="w-4 h-4 opacity-60" />
            </a>
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenSaveLoad(); }}
                className="w-full py-2.5 rounded-xl bg-fantasy-gold/20 border border-fantasy-gold/50 text-fantasy-gold font-medium text-xs flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Muat Save Game
              </button>
            </div>
          </div>
        )}

        {/* Center Hero Content (Aligned with reference screenshot) */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center my-auto flex flex-col items-center">
          
          {/* Main Display Headline */}
          <h1 className="font-cinzel text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-md leading-[1.15]">
            AI Dungeon Master &amp; Virtual Tabletop
          </h1>

          {/* Subtitle (Crafted without AI marketing buzzwords or em dashes) */}
          <p className="mt-6 max-w-2xl text-base md:text-lg text-slate-200 font-light leading-relaxed drop-shadow-sm">
            Petualangan RPG D&amp;D 5E interaktif dengan narasi cabang adaptif, evaluasi aksi taktis logis, dan visual novel tanpa batas skenario.
          </p>

          {/* Center Interactive Glassmorphism Command Pill */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div 
              onClick={handleCopyCommand}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCopyCommand(e); }}
              className="group relative cursor-pointer px-5 py-3 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-white/20 hover:border-fantasy-gold/60 backdrop-blur-xl shadow-2xl transition-all duration-200 flex items-center gap-4 text-xs md:text-sm font-mono text-slate-200"
              title="Klik untuk menyalin perintah peluncur"
            >
              <div className="flex items-center gap-2.5 text-amber-300">
                <span className="text-amber-400 font-bold">$</span>
                <span className="text-white font-medium">{launchCommand}</span>
              </div>

              <div className="h-4 w-[1px] bg-white/20" />

              <button
                type="button"
                onClick={handleCopyCommand}
                aria-label="Salin perintah ke clipboard"
                className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Dual Action CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('campaigns')}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-fantasy-gold via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-cinzel font-bold text-sm tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              Pilih Kampanye Petualangan
            </button>

            <button
              onClick={() => setActiveModal('rules')}
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-500 text-slate-200 font-cinzel font-semibold text-xs tracking-wider backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Scroll className="w-4 h-4 text-amber-400" />
              Mekanik D&amp;D 5E
            </button>
          </div>
        </div>

        {/* Subtle Bottom Hero Quote (Exact counterpart to reference screenshot bottom line) */}
        <div className="relative z-10 w-full pb-8 pt-4 px-6 text-center">
          <p className="text-xs text-slate-400/80 font-normal max-w-xl mx-auto leading-relaxed">
            AetherMaster adalah kanvas naratif, bukan sekadar bot. Dipandu aturan D&amp;D 5E asli dan kecerdasan buatan, dirancang untuk petualanganmu.
          </p>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. CAMPAIGN ARCHIVE SELECTION SECTION (Redesigned with Antislop Asymmetry) */}
      {/* ========================================================================= */}
      <section id="campaigns" className="relative z-20 w-full py-20 px-6 md:px-12 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-slate-800/80">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs uppercase font-semibold tracking-widest text-fantasy-gold flex items-center gap-2">
                <img src="/assets/icons/icon_compass.png" alt="Compass" className="w-3.5 h-3.5 object-contain" />
                Arsip Intelijen Petualangan D&amp;D 5E
              </span>
              <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white tracking-tight">
                Pilih Dunia &amp; Tentukan Takdir
              </h2>
              <p className="text-xs md:text-sm text-slate-400 font-light leading-relaxed">
                Tinjau berkas intelijen taktis, kondisi lingkungan, dan bahaya musuh sebelum merakit lembar karakter petualangmu.
              </p>
            </div>

            {/* Quick Filter / Switcher Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {campaigns.map((c) => {
                const isActive = (c.id === (activeCampaignId || campaigns[0]?.id));
                const meta = CAMPAIGN_METADATA[c.id] || CAMPAIGN_METADATA.whispering_tavern;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveCampaignId(c.id);
                      audio.playClick();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                      isActive 
                        ? `${meta.accentBg} ${meta.accentBorder} text-white shadow-md` 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <img src={meta.iconImage} alt={c.title} className="w-4 h-4 object-contain rounded" />
                    <span className="hidden sm:inline">{c.title.split(' ')[0]} {c.title.split(' ')[1]}</span>
                    <span className="sm:hidden">{c.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading or Empty State */}
          {initLoading ? (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-fantasy-gold" />
              <span className="text-sm">Memuat arsip kampanye petualangan...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              <p className="text-sm">Belum ada modul kampanye yang ditemukan di database.</p>
            </div>
          ) : (() => {
            const currentCamp = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];
            const meta = CAMPAIGN_METADATA[currentCamp?.id] || CAMPAIGN_METADATA.whispering_tavern;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* 1. GRAND MASTER DOSSIER (Left 7 Columns) */}
                <div className="lg:col-span-7 bg-slate-900/80 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl relative">
                  
                  {/* Top Panoramic Visual Banner */}
                  <div className="relative h-60 w-full overflow-hidden">
                    <img 
                      src={meta.bgImage} 
                      alt={currentCamp.title}
                      className="w-full h-full object-cover transform scale-100 hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md ${
                          currentCamp.genre === 'gothic_horror' 
                            ? 'bg-rose-950/90 border-rose-500/50 text-rose-300' 
                            : currentCamp.genre === 'eldritch_mystery' 
                              ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-300' 
                              : 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                        }`}>
                          {currentCamp.genre?.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border backdrop-blur-md ${meta.threatBadge}`}>
                          {meta.threatLevel}
                        </span>
                      </div>
                    </div>

                    {/* Custom 3x3 Sliced Icon Badge */}
                    <div className="absolute -bottom-6 left-6 w-16 h-16 rounded-2xl bg-slate-950 border-2 border-fantasy-gold/60 p-1.5 shadow-2xl backdrop-blur-xl">
                      <img 
                        src={meta.iconImage} 
                        alt={currentCamp.title}
                        className="w-full h-full object-contain rounded-xl" 
                      />
                    </div>
                  </div>

                  {/* Dossier Body */}
                  <div className="pt-10 p-6 md:p-8 space-y-6">
                    <div>
                      <h3 className="font-cinzel text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {currentCamp.title}
                      </h3>
                      <p className="mt-3 text-xs md:text-sm text-slate-300 font-light leading-relaxed">
                        {currentCamp.premise}
                      </p>
                    </div>

                    {/* Dungeon Master Atmospheric Monologue */}
                    <div className="p-4 rounded-xl bg-slate-950/90 border-l-4 border-fantasy-gold text-xs text-amber-200/90 italic font-serif leading-relaxed shadow-inner">
                      {meta.dmQuote}
                    </div>

                    {/* Tactical 5E Intel Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">📍 Lokasi Skenario</span>
                        <p className="text-xs text-white font-medium">{meta.location}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">⚔️ Ancaman Kunci</span>
                        <p className="text-xs text-rose-300 font-medium">{meta.encounter}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">🌫️ Kondisi Medan</span>
                        <p className="text-xs text-slate-300">{meta.environment}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">⚔️ Uji Atribut Kunci</span>
                        <p className="text-xs text-fantasy-gold font-medium">{meta.primarySkill}</p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                      <button
                        onClick={() => onSelectCampaign(currentCamp)}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-fantasy-gold via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-cinzel font-bold text-xs tracking-wider shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Mulai Ekspedisi Ini</span>
                      </button>

                      <span className="text-[11px] text-slate-400 font-mono">
                        Narasi Adaptif AI • Evaluasi Aksi Logis • Mini-VTT 5E
                      </span>
                    </div>

                  </div>
                </div>

                {/* 2. MODULE SELECTOR RAIL (Right 5 Columns) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                      PILIH MODUL LAIN ({campaigns.length})
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono">Klik untuk ganti fokus</span>
                  </div>

                  <div className="space-y-3">
                    {campaigns.map((camp) => {
                      const isSelected = camp.id === currentCamp.id;
                      const campMeta = CAMPAIGN_METADATA[camp.id] || CAMPAIGN_METADATA.whispering_tavern;

                      return (
                        <div
                          key={camp.id}
                          onClick={() => {
                            setActiveCampaignId(camp.id);
                            audio.playSelect();
                          }}
                          className={`cursor-pointer p-4 rounded-2xl transition-all border flex items-start gap-4 ${
                            isSelected
                              ? `bg-slate-900 ${campMeta.accentBorder} shadow-xl scale-[1.01]`
                              : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-600 hover:bg-slate-900/60'
                          }`}
                        >
                          {/* Sliced 3x3 Icon */}
                          <div className={`w-12 h-12 rounded-xl p-1 shrink-0 flex items-center justify-center border ${
                            isSelected ? 'bg-slate-950 border-fantasy-gold/50' : 'bg-slate-900 border-slate-800'
                          }`}>
                            <img src={campMeta.iconImage} alt={camp.title} className="w-full h-full object-contain rounded-lg" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={`font-cinzel text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                {camp.title}
                              </h4>
                              {isSelected && (
                                <span className="text-[9px] font-bold text-fantasy-gold px-2 py-0.5 rounded-full bg-fantasy-gold/10 border border-fantasy-gold/30 shrink-0">
                                  AKTIF
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {camp.premise}
                            </p>

                            <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                              <span>{campMeta.threatLevel}</span>
                              <span>•</span>
                              <span className="text-amber-300">{camp.genre?.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tactical Hint */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1 leading-relaxed">
                    <span className="text-slate-300 font-semibold block">💡 Catatan Petualang:</span>
                    Setiap modul memiliki pohon percabangan mandiri dan dapat di-rewind kapan saja melalui Story Tree modal di dalam game.
                  </div>

                </div>

              </div>
            );
          })()}

        </div>
      </section>



      {/* ========================================================================= */}
      {/* 4. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="relative z-20 w-full border-t border-slate-800/80 bg-slate-950 py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <span>⚔️ AetherMaster AI Platform</span>
          <span>•</span>
          <span>D&amp;D 5E Virtual Tabletop Engine</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveModal('rules')}
            className="hover:text-slate-300 transition-colors"
          >
            Aturan Sistem
          </button>
          <button 
            onClick={() => setActiveModal('guide')}
            className="hover:text-slate-300 transition-colors"
          >
            Panduan
          </button>
          <button 
            onClick={() => setActiveModal('icons')}
            className="hover:text-amber-300 transition-colors"
          >
            Galeri Aset 3x3
          </button>
          <a 
            href="https://github.com/ade781/AetherMaster-AI" 
            target="_blank" 
            rel="noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 5. MODAL OVERLAYS (Sistem 5E, Panduan, Roadmap)                           */}
      {/* ========================================================================= */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Tutup jendela modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal: Sistem 5E */}
            {activeModal === 'rules' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-fantasy-gold/40 flex items-center justify-center text-fantasy-gold">
                    <Scroll className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-white">Sistem Aturan D&amp;D 5E</h3>
                    <p className="text-xs text-slate-400">Implementasi kalkulasi mekanik meja</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white">1. Ability Checks &amp; Logika Tindakan</h4>
                    <p>
                      Setiap aksi pilihan pemain memiliki atribut terkait (Kekuatan, Ketangkasan, Konstitusi, Kecerdasan, Kebijaksanaan, Karisma). Keberhasilan aksi dievaluasi dari skor atribut dan modifier karakter melawan tingkat kesulitan skenario.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white">2. Difficulty Class (DC)</h4>
                    <p>
                      Tingkat kesulitan ditentukan oleh konteks skenario: Mudah (DC 10), Sedang (DC 15), Sulit (DC 20), Sangat Sulit (DC 25). Jika aksi dan kalkulasi karakter memenuhi ambang DC, aksi dinyatakan berhasil.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white">3. Evaluasi Konsekuensi &amp; Narasi Adaptif</h4>
                    <p>
                      AI Dungeon Master mengevaluasi tindakan berdasarkan logika dunia dan latar situasi, membuka cabang cerita baru atau memicu konsekuensi yang masuk akal secara dinamis.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
                  >
                    Mengerti
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Panduan Bermain */}
            {activeModal === 'guide' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-white">Panduan Memulai Petualangan</h3>
                    <p className="text-xs text-slate-400">Langkah mudah menjelajahi AetherMaster</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0">1</span>
                    <div>
                      <h4 className="font-semibold text-white">Pilih Modul Kampanye</h4>
                      <p>Pilih salah satu dari 3 kampanye awal di halaman depan sesuai tema yang kamu sukai.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0">2</span>
                    <div>
                      <h4 className="font-semibold text-white">Rakit Karakter Petualang</h4>
                      <p>Tentukan Ras (Human, Elf, Dwarf, Tiefling), Kelas (Fighter, Wizard, Rogue, Cleric), serta distribusikan atribut dasar.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0">3</span>
                    <div>
                      <h4 className="font-semibold text-white">Tentukan Aksi &amp; Buka Cabang Cerita</h4>
                      <p>Baca narasi AI Dungeon Master, pilih opsi dialog taktis, atau ketikkan aksi kreatifmu sendiri untuk mengeksplorasi dunia.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
                  >
                    Siap Bertualang
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Roadmap */}
            {activeModal === 'roadmap' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-white">Roadmap Fitur Mendatang</h3>
                    <p className="text-xs text-slate-400">Rencana evolusi platform AetherMaster</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">Fase 1: Core AI DM &amp; 5E Engine</h4>
                      <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">SELESAI</span>
                    </div>
                    <p>Evaluasi aksi logis lokal, audio synth Web Audio, percabangan cerita, dan manajemen save SQLite.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">Fase 2: Pertarungan Grid Taktis 2D</h4>
                      <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950 border border-amber-800">DALAM PENGEMBANGAN</span>
                    </div>
                    <p>Peta pertempuran grid dengan token karakter, jangkauan serang, dan garis pandang (Line of Sight).</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">Fase 3: Multi-User Tabletop Sync</h4>
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">TERENCANA</span>
                    </div>
                    <p>Sinkronisasi sesi pesta pemain via WebSocket untuk petualangan kooperatif bersama AI DM.</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Galeri Aset Ikon 3x3 */}
            {activeModal === 'icons' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-fantasy-gold/40 flex items-center justify-center p-1.5">
                    <img src="/assets/icons/icon_swords.png" alt="Icons" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-white">Galeri Aset Ikon 3x3 Buatan Sendiri</h3>
                    <p className="text-xs text-slate-400">Total 27 ikon hasil pemotongan 3x generasi AI khusus tema meja D&amp;D 5E</p>
                  </div>
                </div>

                {/* Set 1: Campaign & Meja Tabletop */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">Set 1: Kampanye &amp; Meja Tabletop (9 Ikon)</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    {[
                      { name: 'Pedang', src: '/assets/icons/icon_swords.png' },
                      { name: 'Tengkorak', src: '/assets/icons/icon_skull.png' },
                      { name: 'Ombak', src: '/assets/icons/icon_wave.png' },
                      { name: 'Kedai', src: '/assets/icons/icon_tavern.png' },
                      { name: 'Perisai', src: '/assets/icons/icon_shield.png' },
                      { name: 'Grimoire', src: '/assets/icons/icon_grimoire.png' },
                      { name: 'Kompas', src: '/assets/icons/icon_compass.png' },
                      { name: 'Portal', src: '/assets/icons/icon_portal.png' },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-center hover:border-fantasy-gold/50 transition-colors">
                        <img src={item.src} alt={item.name} className="w-10 h-10 object-contain rounded" />
                        <span className="text-[10px] text-slate-300 font-mono truncate w-full">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Set 2: Senjata & Relik */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-300">Set 2: Senjata, Ramuan &amp; Relik (9 Ikon)</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    {[
                      { name: 'Rapier', src: '/assets/items/item_rapier.png' },
                      { name: 'Belati Tulang', src: '/assets/items/item_bone_dagger.png' },
                      { name: 'Trisula Laut', src: '/assets/items/item_sea_trident.png' },
                      { name: 'Mahkota', src: '/assets/items/item_golden_crown.png' },
                      { name: 'Ramuan HP', src: '/assets/items/item_01_potion_heal.png' },
                      { name: 'Ramuan Mana', src: '/assets/items/item_02_potion_mana.png' },
                      { name: 'Kunci Tulang', src: '/assets/items/item_06_skeleton_key.png' },
                      { name: 'Jimat Aether', src: '/assets/items/item_05_cursed_amulet.png' },
                      { name: 'Peta Harta', src: '/assets/items/item_treasure_map.png' },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-center hover:border-fantasy-gold/50 transition-colors">
                        <img src={item.src} alt={item.name} className="w-10 h-10 object-contain rounded" />
                        <span className="text-[10px] text-slate-300 font-mono truncate w-full">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Set 3: Sihir, Mantra & Kemampuan */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300">Set 3: Sihir, Mantra &amp; Kemampuan (9 Ikon)</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    {[
                      { name: 'Fireball', src: '/assets/skills/skill_01_fireball.png' },
                      { name: 'Holy Heal', src: '/assets/skills/skill_02_heal.png' },
                      { name: 'Stealth', src: '/assets/skills/skill_03_stealth.png' },
                      { name: 'Frost', src: '/assets/skills/skill_ice_shards.png' },
                      { name: 'Petir', src: '/assets/skills/skill_lightning.png' },
                      { name: 'Kutukan', src: '/assets/skills/skill_skull_curse.png' },
                      { name: 'Vortex', src: '/assets/skills/skill_vortex.png' },
                      { name: 'Mata Gaib', src: '/assets/skills/skill_05_perception.png' },
                      { name: 'Slash', src: '/assets/skills/skill_06_strike.png' },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-center hover:border-fantasy-gold/50 transition-colors">
                        <img src={item.src} alt={item.name} className="w-10 h-10 object-contain rounded" />
                        <span className="text-[10px] text-slate-300 font-mono truncate w-full">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
                  >
                    Tutup Galeri
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
