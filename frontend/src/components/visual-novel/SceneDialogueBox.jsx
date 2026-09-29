import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function SceneDialogueBox({
  speaker,
  mood,
  displayedText,
  isTyping,
  consequenceNote,
  onSkipTypewriter
}) {
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onSkipTypewriter?.();
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-end">
      {/* Consequence Note Banner: Subtle narrative feedback */}
      {consequenceNote && (
        <div className="mb-3.5 bg-amber-500/10 border-l-2 border-amber-400/80 px-3.5 py-2.5 rounded-r-xl flex items-start gap-2.5 text-xs md:text-sm text-amber-200/90 shadow-sm animate-slideDown">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="font-outfit leading-relaxed">{consequenceNote}</span>
        </div>
      )}

      {/* Arcane Dialogue Interface */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSkipTypewriter}
        onKeyDown={handleKeyDown}
        aria-label="Kotak Dialog. Klik atau tekan Spasi untuk mempercepat narasi."
        className="relative bg-slate-950/85 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl transition-all duration-200 hover:border-amber-400/30 group cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        {/* Subtle Fantasy Accent Line on Top */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        {/* Clear Character Nameplate */}
        <div className="absolute -top-3.5 left-5 bg-slate-900/95 border border-amber-500/30 px-3.5 py-1 rounded-full shadow-md flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="font-cinzel text-xs font-bold text-amber-300 tracking-wider uppercase">
            {speaker || 'Dungeon Master'}
          </span>
          {mood && (
            <span className="text-[9px] uppercase font-semibold px-2 py-0.2 rounded-full bg-white/10 text-slate-300">
              {mood}
            </span>
          )}
        </div>

        {/* Strong Dialogue Typography & Contrast */}
        <div className="mt-2 min-h-[72px]">
          <p className="font-outfit text-[15px] md:text-[16px] text-slate-100 leading-relaxed font-normal tracking-wide antialiased">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-2 h-4 ml-1 bg-amber-400/90 animate-pulse align-middle" />
            )}
          </p>
        </div>

        {/* Minimal Footer Cue */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="text-slate-500 text-[10px] hidden sm:inline">
            [Spasi / Klik] Lewati
          </span>
          <div className="flex items-center gap-1 ml-auto text-amber-400/80 group-hover:text-amber-300 transition-colors">
            <span className="text-[10px] tracking-wider uppercase">
              {isTyping ? 'Mempercepat Narasi' : 'Pilih Tindakan'}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
