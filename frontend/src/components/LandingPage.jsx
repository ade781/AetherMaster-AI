import React, { useState } from 'react';
import {
  BookOpen,
  Menu,
  X,
  Scroll,
  Play,
  Shield,
  Dices,
  Sparkles,
  Compass,
  ChevronDown
} from 'lucide-react';
import { IconSwords } from './icons/FantasyIcons';
import CampaignGrid from './landing/CampaignGrid';
import FantasyButton from './common/FantasyButton';
import FantasyModal from './common/FantasyModal';
import FantasyBadge from './common/FantasyBadge';
import audio from '../services/audioService';

export default function LandingPage({
  campaigns = [],
  initLoading = false,
  onSelectCampaign,
  onOpenSaveLoad,
  autosaveRecoveryAvailable = null,
  onRecoverFromAutosave,
  onDismissAutosaveRecovery
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'rules' | 'guide' | null

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-outfit selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full px-5 py-3.5 md:px-10 flex items-center justify-between bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="group flex items-center gap-3 text-slate-100 hover:text-amber-400 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-sm group-hover:border-amber-400/70 transition-colors">
              <IconSwords className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-cinzel text-sm md:text-base font-bold tracking-widest text-white group-hover:text-amber-300 transition-colors">
                AETHERMASTER
              </span>
              <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase -mt-0.5">
                Fantasy Chronicle
              </span>
            </div>
          </a>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-cinzel font-semibold tracking-wider text-slate-300">
          <button
            type="button"
            onClick={() => scrollToSection('campaigns')}
            className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-pointer py-1"
          >
            Modul Petualangan ({campaigns.length})
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            type="button"
            onClick={() => { audio.playClick(); setActiveModal('rules'); }}
            className="hover:text-amber-300 transition-colors cursor-pointer py-1"
          >
            Aturan D&amp;D 5E
          </button>

          <button
            type="button"
            onClick={() => { audio.playClick(); setActiveModal('guide'); }}
            className="hover:text-amber-300 transition-colors cursor-pointer py-1"
          >
            Panduan Bermain
          </button>
        </nav>

        {/* Top Right Action: Lanjutkan Permainan */}
        <div className="hidden md:flex items-center gap-3">
          <FantasyButton
            variant="secondary"
            size="sm"
            icon={BookOpen}
            onClick={onOpenSaveLoad}
          >
            Arsip Simpanan
          </FantasyButton>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl px-6 py-5 flex flex-col gap-4 text-sm animate-fadeIn">
          <button
            type="button"
            onClick={() => scrollToSection('campaigns')}
            className="text-left py-2 font-cinzel font-semibold text-slate-200 hover:text-amber-400 min-h-[44px]"
          >
            Modul Petualangan ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => { setMobileMenuOpen(false); audio.playClick(); setActiveModal('rules'); }}
            className="text-left py-2 font-cinzel font-semibold text-slate-200 hover:text-amber-400 min-h-[44px]"
          >
            Aturan Sistem D&amp;D 5E
          </button>
          <button
            type="button"
            onClick={() => { setMobileMenuOpen(false); audio.playClick(); setActiveModal('guide'); }}
            className="text-left py-2 font-cinzel font-semibold text-slate-200 hover:text-amber-400 min-h-[44px]"
          >
            Panduan Bermain
          </button>
          <div className="pt-2 border-t border-slate-800/80">
            <FantasyButton
              variant="secondary"
              size="md"
              icon={BookOpen}
              className="w-full"
              onClick={() => { setMobileMenuOpen(false); onOpenSaveLoad(); }}
            >
              Arsip Simpanan (Load Game)
            </FantasyButton>
          </div>
        </div>
      )}

      {/* Cinematic Hero Section */}
      <section className="relative min-h-[90vh] md:min-h-screen w-full flex flex-col justify-between overflow-hidden">
        {/* Background Atmosphere */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transform scale-100"
          style={{ backgroundImage: "url('/assets/hero_bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(7,8,12,0.92)_100%)]" />
        </div>

        {/* Center Hero Content with Editorial Hierarchy */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center my-auto pt-32 md:pt-36 pb-12 flex flex-col items-center">
          
          {/* Autosave Recovery Banner */}
          {autosaveRecoveryAvailable && (
            <div className="mb-6 p-4 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left max-w-xl w-full animate-fadeIn">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <FantasyBadge variant="cyan" size="sm">Autosave Ditemukan</FantasyBadge>
                  <span className="text-[11px] text-cyan-200/80 font-mono">
                    {autosaveRecoveryAvailable.location || 'Lokasi Terakhir'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 truncate">
                  Petualangan <strong className="text-amber-300">{autosaveRecoveryAvailable.characterName}</strong> (Lvl {autosaveRecoveryAvailable.characterLevel} {autosaveRecoveryAvailable.characterClass}) di {autosaveRecoveryAvailable.campaignTitle}.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <FantasyButton
                  size="xs"
                  variant="secondary"
                  onClick={onDismissAutosaveRecovery}
                >
                  Abaikan
                </FantasyButton>
                <FantasyButton
                  size="sm"
                  variant="primary"
                  onClick={onRecoverFromAutosave}
                >
                  Lanjutkan
                </FantasyButton>
              </div>
            </div>
          )}

          {/* Subtle Top Metadata */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <FantasyBadge variant="gold" size="sm" icon={Sparkles}>
              D&amp;D 5E Engine
            </FantasyBadge>
            {campaigns.length > 0 && (
              <FantasyBadge variant="neutral" size="sm">
                {campaigns.length} Modul Tersedia
              </FantasyBadge>
            )}
          </div>

          {/* Primary Display Title */}
          <h1 className="font-cinzel text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-md leading-[1.08]">
            AETHERMASTER
          </h1>

          {/* Editorial Subtitle */}
          <p className="mt-3 text-xs sm:text-sm md:text-base font-cinzel font-semibold tracking-[0.25em] text-amber-300/90 uppercase">
            An AI-Driven Fantasy Chronicle
          </p>

          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent my-5" />

          {/* Atmospheric Narrative Description */}
          <p className="max-w-xl text-sm md:text-base text-slate-300/90 font-light leading-relaxed">
            Mengarungi narasi visual novel interaktif berlatar fantasi gelap. Setiap keputusan melahirkan konsekuensi nyata, dievaluasi secara dinamis dengan aturan ketat Dungeons &amp; Dragons 5th Edition.
          </p>

          {/* Dual Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <FantasyButton
              variant="primary"
              size="lg"
              icon={Play}
              sound="select"
              onClick={() => scrollToSection('campaigns')}
            >
              Mulai Petualangan
            </FantasyButton>

            <FantasyButton
              variant="secondary"
              size="lg"
              icon={BookOpen}
              sound="click"
              onClick={onOpenSaveLoad}
            >
              Arsip Simpanan
            </FantasyButton>
          </div>
        </div>

        {/* Bottom Hero Scrim Note */}
        <div className="relative z-10 w-full pb-8 pt-2 px-6 text-center">
          <p className="text-xs text-slate-400 font-light max-w-md mx-auto leading-relaxed">
            Dungeon Master menyusun alur cerita tak terduga berdasarkan pilihan dan lemparan dadu karaktermu.
          </p>
        </div>
      </section>

      {/* Dynamic Campaign Grid Component */}
      <CampaignGrid
        campaigns={campaigns}
        initLoading={initLoading}
        onSelectCampaign={onSelectCampaign}
      />

      {/* Clean Editorial Footer */}
      <footer className="relative z-20 w-full border-t border-white/5 bg-slate-950 py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-outfit">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-cinzel font-semibold text-slate-300">AetherMaster AI</span>
          <span>•</span>
          <span>Virtual Tabletop Fantasy Chronicle</span>
          <span>•</span>
          <span className="text-amber-400/90">Oleh ADE7</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => { audio.playClick(); setActiveModal('rules'); }}
            className="hover:text-amber-300 transition-colors cursor-pointer py-1"
          >
            Aturan D&amp;D 5E
          </button>
          <button
            type="button"
            onClick={() => { audio.playClick(); setActiveModal('guide'); }}
            className="hover:text-amber-300 transition-colors cursor-pointer py-1"
          >
            Panduan Bermain
          </button>
        </div>
      </footer>

      {/* D&D 5E Rules Modal */}
      <FantasyModal
        isOpen={activeModal === 'rules'}
        onClose={() => setActiveModal(null)}
        title="Sistem Aturan D&D 5th Edition"
        subtitle="Mekanika perhitungan status, pertarungan, dan keputusan"
        icon={Dices}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
            <h3 className="font-cinzel font-bold text-amber-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              1. Enam Atribut Dasar (D&amp;D 5E)
            </h3>
            <p className="text-slate-300 font-light leading-relaxed">
              Setiap karakter memiliki nilai atribut: <strong>STR</strong> (Kekuatan), <strong>DEX</strong> (Kelincahan), <strong>CON</strong> (Ketahanan fisik), <strong>INT</strong> (Pengetahuan sihir), <strong>WIS</strong> (Kepekaan naluri), dan <strong>CHA</strong> (Kharisma). Modifier dihitung dengan formula baku <code className="text-amber-300">Math.floor((Score - 10) / 2)</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
            <h3 className="font-cinzel font-bold text-cyan-300 flex items-center gap-2">
              <Dices className="w-4 h-4 text-cyan-400" />
              2. Uji Kemampuan (Ability Check &amp; DC)
            </h3>
            <p className="text-slate-300 font-light leading-relaxed">
              Saat melakukan tindakan kritis, sistem mengevaluasi lemparan dadu virtual <code className="text-cyan-300">d20 + Modifier</code> terhadap tingkat kesulitan (Difficulty Class/DC). Tindakan berhasil jika hasil lemparan mencapai atau melampaui DC.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
            <h3 className="font-cinzel font-bold text-rose-300 flex items-center gap-2">
              <IconSwords className="w-4 h-4 text-rose-400" />
              3. Pertarungan Taktis Berbasis Giliran
            </h3>
            <p className="text-slate-300 font-light leading-relaxed">
              Dalam pertempuran, setiap giliran menentukan serangan terhadap <em>Armor Class (AC)</em> lawan, pengurangan HP, konsumsi Mana untuk mantra sihir, atau pemanfaatan item taktis dari tas petualang.
            </p>
          </div>
        </div>
      </FantasyModal>

      {/* Guide Modal */}
      <FantasyModal
        isOpen={activeModal === 'guide'}
        onClose={() => setActiveModal(null)}
        title="Panduan Bermain"
        subtitle="Langkah-langkah memulai ekspedisi di benua Aether"
        icon={Scroll}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="flex gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-cinzel font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-white mb-1">Pilih Modul Petualangan</h4>
              <p className="text-slate-300 font-light leading-relaxed">
                Tiap kampanye memiliki latar, atmosfer, dan ancaman unik—dari misteri ruang bawah tanah hingga ancaman eldritch laut dalam.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-cinzel font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-white mb-1">Susun Berkas Karakter (Dossier)</h4>
              <p className="text-slate-300 font-light leading-relaxed">
                Tentukan nama, ras, dan kelas pahlawanmu. Tiap kelas dilengkapi profil stat D&amp;D dan perlengkapan awal yang berbeda.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-cinzel font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-white mb-1">Ambil Pilihan atau Beraksi Bebas</h4>
              <p className="text-slate-300 font-light leading-relaxed">
                Pilih opsi aksi yang tersedia pada dek visual novel atau ketikkan aksi kustommu sendiri untuk direspons secara langsung oleh AI Dungeon Master.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-cinzel font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-white mb-1">Arsip Simpanan &amp; Rewind Takdir</h4>
              <p className="text-slate-300 font-light leading-relaxed">
                Gunakan 4 slot penyimpanan (Slot 0 Autosave) serta fitur Story Tree untuk memutar balik waktu (Rewind) jika menghadapi keputusan fatal.
              </p>
            </div>
          </div>
        </div>
      </FantasyModal>
    </div>
  );
}
