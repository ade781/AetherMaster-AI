import React from 'react';
import { Skull, RotateCcw, FolderOpen, Home, AlertOctagon } from 'lucide-react';
import audio from '../services/audioService';

export default function GameOverModal({
  isOpen,
  character,
  onRewind,
  onLoadGame,
  onRestart
}) {
  if (!isOpen) return null;

  const isVictory = Boolean(character && character.hp > 0);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn select-none">
      {/* Vignette glow */}
      <div className={`absolute inset-0 bg-gradient-radial ${isVictory ? 'from-amber-950/30' : 'from-rose-950/30'} via-black/80 to-black pointer-events-none`} />

      <div className={`relative w-full max-w-lg bg-slate-950/95 border-2 ${isVictory ? 'border-amber-500/60 shadow-amber-950/50' : 'border-rose-900/60 shadow-rose-950/50'} rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden`}>
        {/* Background Crest Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 ${isVictory ? 'bg-amber-500/15' : 'bg-rose-600/10'} rounded-full blur-3xl pointer-events-none`} />

        {/* Icon Emblem */}
        <div className={`w-20 h-20 rounded-2xl ${isVictory ? 'bg-amber-950/40 border-2 border-amber-500/60 text-amber-400 shadow-amber-950/40' : 'bg-rose-950/40 border-2 border-rose-700/60 text-rose-500 shadow-rose-950/40'} flex items-center justify-center mb-6 shadow-xl animate-pulse`}>
          {isVictory ? <span className="text-4xl">👑</span> : <Skull className="w-10 h-10" />}
        </div>

        {/* Title */}
        <h2 className={`font-cinzel text-3xl font-extrabold text-transparent bg-clip-text ${isVictory ? 'bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400' : 'bg-gradient-to-r from-rose-400 via-rose-200 to-rose-400'} tracking-wider mb-2`}>
          {isVictory ? 'PETUALANGAN TAMAT' : 'TAKDIR BERAKHIR'}
        </h2>
        <p className={`text-xs uppercase tracking-widest ${isVictory ? 'text-amber-400/90' : 'text-rose-400/80'} font-bold mb-4 flex items-center gap-1.5`}>
          <AlertOctagon className="w-3.5 h-3.5" />
          {isVictory ? `Legenda ${character?.name || 'Pahlawan'} Sang ${character?.characterClass || 'Petualang'} Terukir Abadi` : `Jiwa ${character?.name || 'Petualang'} Telah Gugur`}
        </p>

        {/* Epitaph Dialogue */}
        <div className="w-full p-4 rounded-2xl bg-black/60 border border-white/5 text-slate-300 text-sm leading-relaxed mb-8 italic font-outfit shadow-inner">
          {isVictory
            ? `"Setelah mengarungi 12 babak penuh marabahaya dan rintangan mematikan, fajar kemenangan akhirnya merekah. Keberanian dan takdir ${character?.name || 'Pahlawan'} akan senantiasa dinyanyikan oleh para penyair di seluruh penjuru benua Aether!"`
            : '"Darahmu menyerap dinginnya lantai batu. Bayang-bayang kehampaan menyelimuti pandanganmu saat hembusan nafas terakhir terlepas. Namun dalam pusaran waktu AetherMaster, takdir bukanlah garis yang mutlak."'}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Option 1: Rewind (Pohon Cerita) */}
          <button
            onClick={() => {
              audio.playSelect();
              onRewind();
            }}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-sm tracking-wide shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Putar Waktu (Rewind ke Adegan Aman)
          </button>

          {/* Option 2: Load Game */}
          <button
            onClick={() => {
              audio.playSelect();
              onLoadGame();
            }}
            className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-500 text-slate-200 font-cinzel font-semibold text-xs tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-fantasy-gold" />
            Muat Simpanan (Load Slot)
          </button>

          {/* Option 3: Return to Menu */}
          <button
            onClick={() => {
              audio.playClick();
              onRestart();
            }}
            className="w-full py-2.5 px-5 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Kembali ke Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
}
