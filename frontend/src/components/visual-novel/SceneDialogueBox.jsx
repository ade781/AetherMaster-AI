import React from 'react';
import { Sparkles } from 'lucide-react';

export default function SceneDialogueBox({
  speaker,
  mood,
  displayedText,
  isTyping,
  consequenceNote,
  onSkipTypewriter
}) {
  return (
    <div className="flex-1">
      {/* Consequence Note Banner */}
      {consequenceNote && (
        <div className="mb-4 bg-amber-500/10 border-l-4 border-amber-400 px-4 py-3 rounded-r-xl flex items-start gap-3 text-sm text-amber-200 animate-slideDown shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{consequenceNote}</span>
        </div>
      )}

      {/* Main Dialogue Box */}
      <div
        onClick={onSkipTypewriter}
        className="relative bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl cursor-pointer group hover:bg-white/10 transition-colors"
      >
        {/* Speaker Nameplate */}
        <div className="absolute -top-3 left-6 bg-slate-950/90 backdrop-blur-md border border-white/20 px-4 py-1 rounded-full shadow-lg flex items-center gap-2">
          <span className="font-cinzel text-xs font-bold text-amber-300 tracking-widest uppercase">
            {speaker || 'Dungeon Master'}
          </span>
          {mood && (
            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              {mood}
            </span>
          )}
        </div>

        {/* Typewriter Text */}
        <div className="mt-3 min-h-[70px]">
          <p className="font-outfit text-[14px] md:text-[15px] text-slate-200 leading-relaxed font-normal">
            {displayedText}
            {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />}
          </p>
        </div>

        {/* Footer Hint */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="tracking-wider uppercase ml-auto text-slate-400">
            {isTyping ? 'Klik untuk mempercepat narasi' : 'Pilih tindakan di bawah'}
          </span>
        </div>
      </div>
    </div>
  );
}
