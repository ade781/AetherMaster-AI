import React, { useState } from 'react';
import { BookOpen, Compass, Target, ChevronDown, ChevronUp, X } from 'lucide-react';
import audio from '../../services/audioService';

export default function SceneMissionCodex({ missionLog, character, session, campaign }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const paragraphs = String(missionLog?.prologue || '')
    .split('\n')
    .map(p => p.trim())
    .filter(Boolean);

  const toggleExpand = () => {
    audio.playClick();
    setIsExpanded(prev => !prev);
  };

  return (
    <div className="absolute top-14 md:top-16 left-3 md:left-6 right-3 md:right-6 z-10 pointer-events-auto select-none">
      {/* Sleek Compact Banner (Scene/World remains visible) */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/75 backdrop-blur-md border border-amber-500/25 shadow-lg">
        <button
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Tutup Catatan Misi' : 'Buka Catatan Misi'}
          className="flex items-center gap-2 text-left min-w-0 flex-1 hover:opacity-90 transition-opacity cursor-pointer py-0.5"
        >
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-300 shrink-0">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <span className="font-cinzel text-[11px] font-bold text-amber-300 uppercase tracking-wider shrink-0 hidden sm:inline">
              Misi:
            </span>
            <span className="font-outfit text-xs text-slate-200 truncate">
              {missionLog?.objective || 'Tuntaskan investigasi dan netralkan sumber krisis.'}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full hidden md:inline">
            Babak {session?.turnCount || 1}/{campaign?.totalActs || 12}
          </span>
          <button
            onClick={toggleExpand}
            className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
            title={isExpanded ? 'Tutup Jurnal' : 'Buka Jurnal Misi'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Codex Modal / Drawer (Only when player requests full context) */}
      {isExpanded && (
        <div className="mt-2 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-amber-500/30 p-4 md:p-5 shadow-2xl animate-fadeIn">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-cinzel text-sm font-bold text-amber-200">
                  {missionLog?.title || 'Jurnal Misi Petualang'}
                </h3>
                <div className="text-[11px] text-slate-400">
                  {character?.name || 'Petualang'} sang {character?.characterClass || 'Pengelana'} ({character?.race || 'Human'})
                </div>
              </div>
            </div>
            <button
              onClick={toggleExpand}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Tutup Jurnal Misi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prologue Content */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <div className="md:col-span-8 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider block mb-1">
                Latar Belakang & Dokumen Catatan
              </span>
              {paragraphs.length > 0 ? (
                paragraphs.map((p, idx) => (
                  <p key={idx} className="font-outfit text-slate-300 leading-relaxed">
                    {p}
                  </p>
                ))
              ) : (
                <p className="text-slate-500 italic">Belum ada berkas narasi prolog tercatat.</p>
              )}
            </div>

            <div className="md:col-span-4 bg-slate-900/80 border border-amber-500/20 rounded-xl p-3 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Objektif Utama
              </span>
              <p className="font-outfit text-xs text-amber-100/90 leading-relaxed">
                {missionLog?.objective || 'Tuntaskan investigasi dan netralkan sumber krisis.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
