import React, { useState, useEffect } from 'react';
import { Skull, RotateCcw, FolderOpen, Home, AlertOctagon, ScrollText, ChevronDown, ChevronUp, Shield, Coins, Sparkles } from 'lucide-react';
import audio from '../services/audioService';

const API_BASE = 'http://127.0.0.1:5000/api/story';

export default function GameOverModal({
  isOpen,
  character,
  session,
  onRewind,
  onLoadGame,
  onRestart
}) {
  const [summary, setSummary] = useState(null);
  const [showChronicle, setShowChronicle] = useState(false);

  useEffect(() => {
    if (isOpen && session?.id) {
      fetch(`${API_BASE}/summary/${session.id}`)
        .then(res => res.json())
        .then(d => {
          if (d.success) setSummary(d.data);
        })
        .catch(e => console.warn('Could not load summary:', e));
    }
  }, [isOpen, session?.id]);

  if (!isOpen) return null;

  const isVictory = Boolean(character && character.hp > 0);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn select-none overflow-y-auto">
      {/* Vignette glow */}
      <div className={`absolute inset-0 bg-gradient-radial ${isVictory ? 'from-amber-950/30' : 'from-rose-950/30'} via-black/80 to-black pointer-events-none`} />

      <div className={`relative w-full max-w-xl my-auto bg-slate-950/95 border-2 ${isVictory ? 'border-amber-500/60 shadow-amber-950/50' : 'border-rose-900/60 shadow-rose-950/50'} rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden`}>
        {/* Background Crest Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 ${isVictory ? 'bg-amber-500/15' : 'bg-rose-600/10'} rounded-full blur-3xl pointer-events-none`} />

        {/* Icon Emblem */}
        <div className={`w-16 h-16 rounded-2xl ${isVictory ? 'bg-amber-950/40 border-2 border-amber-500/60 text-amber-400 shadow-amber-950/40' : 'bg-rose-950/40 border-2 border-rose-700/60 text-rose-500 shadow-rose-950/40'} flex items-center justify-center mb-4 shadow-xl animate-pulse`}>
          {isVictory ? <span className="text-3xl">👑</span> : <Skull className="w-8 h-8" />}
        </div>

        {/* Title */}
        <h2 className={`font-cinzel text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text ${isVictory ? 'bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400' : 'bg-gradient-to-r from-rose-400 via-rose-200 to-rose-400'} tracking-wider mb-2`}>
          {isVictory ? 'PETUALANGAN TAMAT' : 'TAKDIR BERAKHIR'}
        </h2>
        <p className={`text-xs uppercase tracking-widest ${isVictory ? 'text-amber-400/90' : 'text-rose-400/80'} font-bold mb-4 flex items-center gap-1.5`}>
          <AlertOctagon className="w-3.5 h-3.5" />
          {isVictory ? `Legenda ${character?.name || 'Pahlawan'} Sang ${character?.characterClass || 'Petualang'} Terukir Abadi` : `Jiwa ${character?.name || 'Petualang'} Telah Gugur`}
        </p>

        {/* Epitaph Dialogue */}
        <div className="w-full p-4 rounded-2xl bg-black/60 border border-white/5 text-slate-300 text-xs sm:text-sm leading-relaxed mb-4 italic font-outfit shadow-inner">
          {isVictory
            ? `"Setelah mengarungi 12 babak penuh marabahaya dan rintangan mematikan, fajar kemenangan akhirnya merekah. Keberanian dan takdir ${character?.name || 'Pahlawan'} akan senantiasa dinyanyikan oleh para penyair di seluruh penjuru benua Aether!"`
            : '"Darahmu menyerap dinginnya lantai batu. Bayang-bayang kehampaan menyelimuti pandanganmu saat hembusan nafas terakhir terlepas. Namun dalam pusaran waktu AetherMaster, takdir bukanlah garis yang mutlak."'}
        </div>

        {/* Summary Chronicle Toggle & Section */}
        {summary && (
          <div className="w-full mb-6 text-left">
            <button
              onClick={() => {
                audio.playClick();
                setShowChronicle(!showChronicle);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 font-cinzel text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-md"
            >
              <span className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-amber-400" />
                Kronik & Rangkuman 12 Babak Petualangan
              </span>
              {showChronicle ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
            </button>

            {showChronicle && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 max-h-56 overflow-y-auto space-y-3 custom-scrollbar text-xs">
                {/* Stats recap row */}
                <div className="grid grid-cols-3 gap-2 pb-3 border-b border-slate-800/60 text-center font-cinzel">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Selesai</span>
                    <span className="font-bold text-amber-400 flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" /> {summary.totalStages} Babak
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Sisa HP</span>
                    <span className="font-bold text-rose-400 flex items-center justify-center gap-1">
                      <Shield className="w-3 h-3" /> {summary.finalHp}/{summary.maxHp}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Kekayaan</span>
                    <span className="font-bold text-amber-300 flex items-center justify-center gap-1">
                      <Coins className="w-3 h-3" /> {summary.finalGold} Emas
                    </span>
                  </div>
                </div>

                {/* Timeline nodes */}
                <div className="space-y-2 pt-1">
                  <h4 className="font-cinzel text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Jejak Perjalanan:
                  </h4>
                  {summary.timeline.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-2 rounded-lg bg-black/30 border border-white/5 hover:border-slate-700 transition-colors">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-cinzel text-[10px] font-bold shrink-0">
                        B.{item.stage}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-200 text-[11px] truncate">
                          {item.title} <span className="text-slate-500 font-normal">({item.location})</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5 leading-snug line-clamp-2">
                          {item.consequence}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Option 1: Rewind (Pohon Cerita) */}
          <button
            onClick={() => {
              audio.playSelect();
              onRewind();
            }}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs tracking-wide shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Putar Waktu (Pohon Cerita & Cabang Lain)
          </button>

          {/* Option 2: Load Game */}
          <button
            onClick={() => {
              audio.playSelect();
              onLoadGame();
            }}
            className="w-full py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-500 text-slate-200 font-cinzel font-semibold text-xs tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-fantasy-gold" />
            Muat Simpanan (Load Slot)
          </button>

          {/* Option 3: Return to Menu */}
          <button
            onClick={() => {
              audio.playClick();
              onRestart();
            }}
            className="w-full py-2 px-5 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Kembali ke Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
}
