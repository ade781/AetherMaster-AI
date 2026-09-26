import React, { useState } from 'react';
import {
  BookOpen,
  Menu,
  X,
  Scroll,
  Compass,
  ChevronDown
} from 'lucide-react';
import { IconSwords } from './icons/FantasyIcons';

import HeroBanner from './landing/HeroBanner';
import CampaignGrid from './landing/CampaignGrid';
import FeaturesShowcase from './landing/FeaturesShowcase';

export default function LandingPage({
  campaigns = [],
  initLoading = false,
  onSelectCampaign,
  onOpenSaveLoad,
  showToast
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

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
      <header className="fixed top-0 left-0 right-0 z-40 w-full px-6 py-4 md:px-12 flex items-center justify-between bg-slate-950/70 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="group flex items-center gap-2.5 text-slate-100 hover:text-amber-400 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-amber-500/40 flex items-center justify-center p-1 shadow-sm group-hover:border-amber-400 transition-colors">
              <IconSwords className="w-6 h-6" />
            </div>
            <span className="font-cinzel text-base md:text-lg font-bold tracking-wide text-white group-hover:text-amber-400 transition-colors">
              /aethermaster
            </span>
          </a>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            onClick={() => scrollToSection('campaigns')}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            Kampanye ({campaigns.length})
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          <button
            onClick={() => setActiveModal('rules')}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            Sistem 5E
          </button>

          <button
            onClick={() => setActiveModal('guide')}
            className="hover:text-white transition-colors"
          >
            Panduan
          </button>

          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold tracking-wider text-amber-400 font-mono shadow-sm select-none">
            MADE BY ADE7
          </span>
        </nav>

        {/* Top Right Save Load */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenSaveLoad}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg min-h-[40px]"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Muat Save Game
          </button>
        </div>

        {/* Mobile Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl px-6 py-5 flex flex-col gap-4 text-sm animate-fadeIn">
          <button
            onClick={() => scrollToSection('campaigns')}
            className="text-left py-2 font-medium text-slate-200 hover:text-amber-400 min-h-[44px]"
          >
            Pilih Kampanye ({campaigns.length})
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); setActiveModal('rules'); }}
            className="text-left py-2 font-medium text-slate-200 hover:text-amber-400 min-h-[44px]"
          >
            Sistem Aturan D&amp;D 5E
          </button>
          <div className="flex items-center justify-between py-1 min-h-[44px]">
            <button
              onClick={() => { setMobileMenuOpen(false); setActiveModal('guide'); }}
              className="text-left font-medium text-slate-200 hover:text-amber-400"
            >
              Panduan Bermain
            </button>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 font-mono select-none">
              MADE BY ADE7
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenSaveLoad(); }}
              className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-medium text-xs flex items-center justify-center gap-2 min-h-[44px]"
            >
              <BookOpen className="w-4 h-4" />
              Muat Save Game
            </button>
          </div>
        </div>
      )}

      {/* 1. Hero Banner Component */}
      <HeroBanner
        onStartAdventure={() => scrollToSection('campaigns')}
        onOpenRules={() => setActiveModal('rules')}
        showToast={showToast}
      />

      {/* 2. Dynamic Campaign Grid Component (Populated from DB) */}
      <CampaignGrid
        campaigns={campaigns}
        initLoading={initLoading}
        onSelectCampaign={onSelectCampaign}
      />

      {/* 3. Features Showcase Component */}
      <FeaturesShowcase />

      {/* 4. Footer */}
      <footer className="relative z-20 w-full border-t border-slate-800/80 bg-slate-950 py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span>⚔️ AetherMaster VTT Platform</span>
          <span>•</span>
          <span>D&amp;D 5E Virtual Tabletop Engine</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">Dibuat oleh ADE7</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setActiveModal('rules')} className="hover:text-slate-300 transition-colors">
            Aturan Sistem
          </button>
          <button onClick={() => setActiveModal('guide')} className="hover:text-slate-300 transition-colors">
            Panduan
          </button>
        </div>
      </footer>

      {/* 5. Standard Modal Overlays */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
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
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
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
                      Setiap aksi pemain memiliki atribut terkait (Kekuatan, Ketangkasan, Konstitusi, Kecerdasan, Kebijaksanaan, Karisma). Keberhasilan aksi dievaluasi dari skor atribut dan modifier karakter melawan tingkat kesulitan skenario.
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
                      Dungeon Master mengevaluasi tindakan berdasarkan logika dunia dan latar situasi, membuka cabang cerita baru atau memicu konsekuensi yang masuk akal secara dinamis.
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
                      <p>Pilih salah satu dari kampanye yang tersedia di arsip petualangan.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0">2</span>
                    <div>
                      <h4 className="font-semibold text-white">Rakit Karakter Petualang</h4>
                      <p>Tentukan Ras (Human, Elf, Dwarf, Tiefling, Dragonborn), Kelas (Paladin, Wizard, Rogue, Cleric, dll.), serta distribusikan atribut dasar.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0">3</span>
                    <div>
                      <h4 className="font-semibold text-white">Tentukan Aksi &amp; Lempar Dadu D20</h4>
                      <p>Gunakan tombol pilihan aksi taktis atau ketik aksi bebas. Dadu D20 3D akan memvalidasi keberhasilan aksimu!</p>
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

          </div>
        </div>
      )}

    </div>
  );
}
