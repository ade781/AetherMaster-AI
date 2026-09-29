import React from 'react';
import { BookOpen, Compass, Target } from 'lucide-react';

export default function SceneMissionCodex({ missionLog, character, session, campaign }) {
  const paragraphs = String(missionLog?.prologue || '')
    .split('\n')
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="absolute top-16 md:top-20 left-4 md:left-6 right-4 md:right-6 z-10 rounded-2xl bg-gradient-to-b from-slate-950/85 via-slate-900/75 to-slate-950/90 backdrop-blur-xl border border-amber-500/30 p-4 md:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] animate-fadeIn pointer-events-auto">
      {/* Top Subtle Amber Horizon Line */}
      <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-900/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <BookOpen className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                Jurnal Misi
              </span>
              <h2 className="font-cinzel text-sm md:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100 tracking-wide">
                {missionLog?.title || 'Jurnal Misi Petualang'}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
              <span className="text-amber-200/90 font-medium">
                {character?.name || 'Petualang'} sang {character?.characterClass || 'Pengelana'}
              </span>
              <span className="text-white/30">•</span>
              <span className="capitalize text-slate-400">{character?.race || 'Human'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 shadow-inner">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Babak {session?.turnCount || 1} dari {campaign?.totalActs || 12}</span>
          </div>
        </div>
      </div>

      {/* Narrative Prologue & Objectives Grid */}
      <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Latar Belakang & Catatan Penugasan */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-amber-400/90">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span>Latar Belakang &amp; Catatan Penugasan</span>
          </div>
          <div className="space-y-1.5 text-slate-200 font-outfit text-xs md:text-sm leading-relaxed antialiased font-normal">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, idx) => (
                <p key={idx} className="first:text-slate-100 text-slate-300">
                  {p}
                </p>
              ))
            ) : (
              <p className="text-slate-400 italic">
                Belum ada berkas narasi prolog tercatat.
              </p>
            )}
          </div>
        </div>

        {/* Target Utama Misi */}
        <div className="lg:col-span-4 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-black/60 border border-amber-500/30 rounded-xl p-3.5 flex flex-col gap-2 shadow-md">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-300 font-cinzel">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-300">
              <Target className="w-3.5 h-3.5" />
            </div>
            <span>Target Utama Misi</span>
          </div>
          <p className="font-outfit text-xs text-amber-100/90 leading-relaxed font-normal">
            {missionLog?.targetGoal || 'Tuntaskan investigasi dan netralkan sumber krisis.'}
          </p>
        </div>
      </div>
    </div>
  );
}
