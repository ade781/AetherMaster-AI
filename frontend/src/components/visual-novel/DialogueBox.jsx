import React, { useRef } from 'react';
import { Sparkles, ChevronRight, FastForward } from 'lucide-react';

export default function DialogueBox({
  speaker,
  mood,
  displayedText,
  isTyping,
  consequenceNote,
  onSkipTypewriter,
  onAdvance
}) {
  const containerRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    if (isTyping) {
      onSkipTypewriter?.();
    } else {
      // Tap 2: Advance to action choices
      if (onAdvance) {
        onAdvance();
      } else {
        const actionDeck = document.getElementById('scene-action-deck');
        if (actionDeck) {
          actionDeck.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-end min-h-0">
      {/* Consequence Note Banner: Narrative feedback badge */}
      {consequenceNote && (
        <div className="mb-3 bg-amber-500/15 border-l-2 border-amber-400 px-3.5 py-2.5 rounded-r-xl flex items-start gap-2.5 text-xs md:text-sm text-amber-200 shadow-sm animate-slideDown">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="font-outfit leading-relaxed drop-shadow-sm">{consequenceNote}</span>
        </div>
      )}

      {/* Arcane Dialogue Box with Mobile Auto-Grow & Scroll Safeguard */}
      <div
        ref={containerRef}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={
          isTyping
            ? 'Kotak Dialog sedang mengetik. Klik untuk melengkapi narasi seketika.'
            : 'Narasi selesai. Klik untuk melangkah ke pilihan tindakan.'
        }
        className="relative bg-slate-950/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl transition-all duration-200 hover:border-amber-400/40 group cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 select-none"
      >
        {/* Fantasy Accent Glow Line on Top */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* Character Nameplate */}
        <div className="absolute -top-3.5 left-4 sm:left-5 bg-slate-900/95 border border-amber-500/40 px-3 sm:px-3.5 py-1 rounded-full shadow-md flex items-center gap-2 max-w-[85%] truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
          <span className="font-cinzel text-xs font-bold text-amber-300 tracking-wider uppercase truncate">
            {speaker || 'Dungeon Master'}
          </span>
          {mood && (
            <span className="text-[9px] uppercase font-semibold px-2 py-0.2 rounded-full bg-white/10 text-slate-300 border border-white/10 shrink-0">
              {mood}
            </span>
          )}
        </div>

        {/* Dynamic Responsive Typography with WCAG AAA Contrast (>16:1) */}
        <div className="mt-2 min-h-[64px] sm:min-h-[72px] max-h-[42vh] sm:max-h-[50vh] overflow-y-auto pr-1 text-slate-50 leading-relaxed font-normal tracking-wide antialiased scrollbar-thin scrollbar-thumb-amber-500/20 hover:scrollbar-thumb-amber-500/40 scrollbar-track-transparent">
          <p className="font-outfit text-[15px] sm:text-[16px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] break-words whitespace-pre-wrap">
            {displayedText}
            {isTyping && (
              <span
                className="inline-block w-2 h-4 ml-1.5 bg-amber-400 align-middle animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                aria-hidden="true"
              />
            )}
          </p>
        </div>

        {/* Interactive Tap-to-Advance Two-Step Indicator */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <FastForward className="w-3 h-3 text-amber-400/80" />
            <span className="hidden sm:inline">
              {isTyping ? '[Ketuk] Lengkapi teks' : '[Ketuk lagi] Lanjut ke tindakan'}
            </span>
            <span className="sm:hidden">
              {isTyping ? 'Ketuk: Lengkapi' : 'Ketuk: Pilihan'}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-auto text-amber-400/90 group-hover:text-amber-300 transition-colors font-medium">
            <span className="text-[10px] tracking-wider uppercase">
              {isTyping ? 'Akselerasi' : 'Pilih Aksi'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
