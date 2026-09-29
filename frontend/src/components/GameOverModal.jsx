import React, { useState, useEffect } from 'react';
import { Skull, RotateCcw, FolderOpen, Home, AlertOctagon, ScrollText, ChevronDown, ChevronUp, Shield, Coins, Sparkles, Crown } from 'lucide-react';
import FantasyButton from './common/FantasyButton';
import FantasyBadge from './common/FantasyBadge';
import audio from '../services/audioService';
import storyApi from '../services/api';

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
      storyApi.getSessionSummary(session.id)
        .then(d => {
          if (d.success) setSummary(d.data);
        })
        .catch(e => console.warn('Could not load summary:', e));
    }
  }, [isOpen, session?.id]);

  if (!isOpen) return null;

  const isVictory = Boolean(character && character.hp > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
    >
      {/* Background vignette & atmospheric scrim */}
      <div className={`absolute inset-0 bg-gradient-radial ${isVictory ? 'from-amber-950/20' : 'from-rose-950/20'} via-black/80 to-black pointer-events-none`} />

      <div className={`relative w-full max-w-xl my-auto bg-slate-950 border ${isVictory ? 'border-amber-500/50 shadow-amber-950/40' : 'border-rose-900/50 shadow-rose-950/40'} rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden`}>
        {/* Emblem */}
        <div className={`w-14 h-14 rounded-2xl ${isVictory ? 'bg-amber-950/40 border border-amber-500/50 text-amber-400' : 'bg-rose-950/40 border border-rose-700/50 text-rose-500'} flex items-center justify-center mb-4 shadow-lg`}>
          {isVictory ? <Crown className="w-7 h-7" /> : <Skull className="w-7 h-7" />}
        </div>

        {/* Title */}
        <h2 id="game-over-title" className={`font-cinzel text-2xl sm:text-3xl font-black ${isVictory ? 'text-amber-300' : 'text-rose-400'} tracking-wider mb-2`}>
          {isVictory ? 'PETUALANGAN TAMAT' : 'TAKDIR BERAKHIR'}
        </h2>

        {/* Status Subtitle */}
        <div className="mb-4">
          <FantasyBadge variant={isVictory ? 'gold' : 'crimson'} size="sm" icon={AlertOctagon}>
            {isVictory
              ? `Legenda ${character?.name || 'Pahlawan'} Sang ${character?.characterClass || 'Petualang'} Terukir Abadi`
              : `Jiwa ${character?.name || 'Petualang'} Telah Gugur`}
          </FantasyBadge>
        </div>

        {/* Epitaph Dialogue Box */}
        <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-white/5 text-slate-300 text-xs sm:text-sm leading-relaxed mb-5 italic font-outfit shadow-inner">
          {isVictory
            ? `"Setelah mengarungi 12 babak penuh marabahaya dan rintangan mematikan, fajar kemenangan akhirnya merekah. Keberanian dan takdir ${character?.name || 'Pahlawan'} akan senantiasa dinyanyikan oleh para penyair di seluruh penjuru benua Aether!"`
            : '"Darahmu meresap dinginnya lantai batu. Bayang-bayang kehampaan menyelimuti pandanganmu saat hembusan nafas terakhir terlepas. Namun dalam pusaran takdir AetherMaster, sebuah akhir bukanlah jalan buntu."'}
        </div>

        {/* Summary Chronicle Accordion */}
        {summary && (
          <div className="w-full mb-6 text-left">
            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setShowChronicle(!showChronicle);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-white/10 hover:border-amber-400/40 text-slate-200 font-cinzel text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-sm min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-amber-400" />
                Kronik &amp; Rangkuman 12 Babak Petualangan
              </span>
              {showChronicle ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
            </button>

            {showChronicle && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-900/70 border border-white/5 max-h-56 overflow-y-auto space-y-3 custom-scrollbar text-xs">
                {/* Stats Recap */}
                <div className="grid grid-cols-3 gap-2 pb-3 border-b border-white/5 text-center font-mono">
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-sans">Selesai</span>
                    <span className="font-bold text-amber-400 flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" /> {summary.totalStages} Babak
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-sans">Sisa HP</span>
                    <span className="font-bold text-rose-400 flex items-center justify-center gap-1">
                      <Shield className="w-3 h-3" /> {summary.finalHp}/{summary.maxHp}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-sans">Kekayaan</span>
                    <span className="font-bold text-amber-300 flex items-center justify-center gap-1">
                      <Coins className="w-3 h-3" /> {summary.finalGold} Emas
                    </span>
                  </div>
                </div>

                {/* Timeline Nodes */}
                {Array.isArray(summary.timeline) && summary.timeline.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="font-cinzel text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Jejak Perjalanan:
                    </h4>
                    {summary.timeline.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-start p-2 rounded-lg bg-slate-950/60 border border-white/5">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-cinzel text-[10px] font-bold shrink-0">
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
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="w-full flex flex-col gap-2.5">
          <FantasyButton
            variant="primary"
            size="md"
            icon={RotateCcw}
            sound="select"
            className="w-full"
            onClick={onRewind}
          >
            Putar Waktu (Pohon Cerita &amp; Cabang Lain)
          </FantasyButton>

          <FantasyButton
            variant="secondary"
            size="md"
            icon={FolderOpen}
            sound="click"
            className="w-full"
            onClick={onLoadGame}
          >
            Muat Simpanan (Load Slot)
          </FantasyButton>

          <FantasyButton
            variant="ghost"
            size="sm"
            icon={Home}
            sound="click"
            className="w-full text-slate-400 hover:text-slate-200"
            onClick={onRestart}
          >
            Kembali ke Menu Utama
          </FantasyButton>
        </div>
      </div>
    </div>
  );
}
