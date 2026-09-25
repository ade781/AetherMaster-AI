import React from 'react';
import { Play, Scroll } from 'lucide-react';
import audio from '../../services/audioService';

export default function HeroBanner({ onStartAdventure, onOpenRules, showToast }) {
  return (
    <section className="relative min-h-[90vh] md:min-h-screen w-full flex flex-col justify-between overflow-hidden">
      {/* Background Image with Cinematic Scrim and Vignette */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transform scale-100 transition-transform duration-1000"
        style={{ backgroundImage: "url('/assets/hero_bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/40 to-slate-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(9,10,15,0.75)_100%)]" />
      </div>

      {/* Center Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center my-auto pt-24 md:pt-28 pb-12 flex flex-col items-center">
        {/* Feature Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/40 text-amber-400 text-xs font-mono font-semibold tracking-wider shadow-lg mb-4 backdrop-blur-md">
          <span>⚔️</span>
          <span>D&amp;D 5E Virtual Tabletop Engine</span>
        </div>

        {/* Main Display Headline */}
        <h1 className="font-cinzel text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-md leading-[1.15]">
          Dungeon Master &amp; Virtual Tabletop RPG
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl text-base md:text-lg text-slate-200 font-light leading-relaxed drop-shadow-sm">
          Petualangan RPG D&amp;D 5E interaktif dengan narasi cabang adaptif, evaluasi aksi taktis server-authoritative, dan visual novel dinamis.
        </p>

        {/* Dual Action CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => { audio.playSelect(); onStartAdventure(); }}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-sm tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 min-h-[48px]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Mulai Petualangan</span>
          </button>

          <button
            onClick={() => { audio.playClick(); onOpenRules(); }}
            className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-500 text-slate-200 font-cinzel font-semibold text-xs tracking-wider backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 min-h-[48px]"
          >
            <Scroll className="w-4 h-4 text-amber-400" />
            <span>Mekanik D&amp;D 5E</span>
          </button>
        </div>
      </div>

      {/* Bottom Hero Quote */}
      <div className="relative z-10 w-full pb-8 pt-4 px-6 text-center">
        <p className="text-xs text-slate-400/80 font-normal max-w-xl mx-auto leading-relaxed">
          AetherMaster adalah kanvas naratif takdir. Dipandu fondasi aturan petualangan meja klasik, dirancang untuk setiap keputusan beraniku.
        </p>
      </div>
    </section>
  );
}
