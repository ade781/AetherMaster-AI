import React from 'react';
import { BookOpen, X, Target, Shield, Compass } from 'lucide-react';
import audio from '../services/audioService';

export default function BacklogModal({ isOpen, onClose, session, character }) {
  if (!isOpen) return null;

  let parsedLog = session?.missionLog;
  if (typeof parsedLog === 'string') {
    try {
      parsedLog = JSON.parse(parsedLog);
    } catch {
      parsedLog = null;
    }
  }

  const missionLog = {
    title: parsedLog?.title || 'Jurnal Misi Petualang',
    prologue: parsedLog?.prologue || 'Informasi latar belakang misi sedang disinkronkan oleh Dungeon Master. Selesaikan penyelidikan di lokasi saat ini.',
    targetGoal: parsedLog?.targetGoal || 'Tuntaskan investigasi dan netralkan sumber krisis.'
  };

  const paragraphs = String(missionLog.prologue || '')
    .split('\n')
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg md:text-xl font-bold text-amber-300 tracking-wide">
                {missionLog.title || 'Jurnal Misi Petualang'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span className="font-medium text-slate-300">
                  {character?.name || 'Petualang'} sang {character?.characterClass || 'Pengelana'}
                </span>
                <span>•</span>
                <span className="capitalize">{character?.race || 'Human'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => { audio.playClick(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-hide">
          {/* Status Badge Row */}
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Babak {session?.turnCount || 1} dari 12
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              HP: {character?.hp || 0}/{character?.maxHp || 0}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              Emas: {character?.gold || 0} Koin
            </span>
          </div>

          {/* Prologue & Background Narrative */}
          <div className="space-y-3.5 bg-black/40 border border-white/5 rounded-xl p-5 md:p-6 shadow-inner">
            <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400/80 pb-1 border-b border-white/5">
              Latar Belakang &amp; Catatan Penugasan
            </div>
            {paragraphs.length > 0 ? (
              paragraphs.map((p, idx) => (
                <p key={idx} className="font-outfit text-sm md:text-[15px] text-slate-200 leading-relaxed font-normal">
                  {p}
                </p>
              ))
            ) : (
              <p className="font-outfit text-sm text-slate-400 italic">
                Belum ada berkas narasi prolog tercatat.
              </p>
            )}
          </div>

          {/* Target & Sasaran Utama Misi */}
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl p-4 md:p-5 flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0 mt-0.5">
              <Target className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-cinzel text-xs font-bold uppercase tracking-wider text-amber-300">
                Target Utama Misi
              </div>
              <p className="font-outfit text-xs md:text-sm text-slate-200 leading-relaxed">
                {missionLog.targetGoal || 'Tuntaskan penyelidikan di lokasi dan atasi ancaman utama.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900/50 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-300">L</kbd> untuk buka/tutup cepat
          </span>
          <button
            onClick={() => { audio.playClick(); onClose(); }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Lanjutkan Aksi
          </button>
        </div>
      </div>
    </div>
  );
}
