import React, { useState, useEffect } from 'react';
import { Sparkles, Send, ArrowRight } from 'lucide-react';
import audio from '../../services/audioService';

export default function SceneActionDeck({
  choices = [],
  character,
  isLoading,
  onChooseAction
}) {
  const [customActionText, setCustomActionText] = useState('');
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);

  // Keyboard navigation for choices (1, 2, 3, 4) when typing input is not active
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLoading) return;
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= choices.length) {
        const choice = choices[num - 1];
        if (choice) {
          const hasReqItem = !choice.requiredItem || (character?.inventory || []).some(i => {
            if (!choice.requiredItem) return true;
            const req = String(choice.requiredItem).toLowerCase().trim();
            const itemId = String(i.id || '').toLowerCase().trim();
            const itemName = String(i.name || '').toLowerCase().trim();
            return itemId === req || itemName === req || itemName.includes(req) || req.includes(itemName);
          });

          if (hasReqItem) {
            e.preventDefault();
            handleChoiceClick(choice);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, isLoading, character]);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customActionText.trim() || isLoading) return;
    audio.playClick();
    onChooseAction({ id: 'custom', customText: customActionText.trim(), tone: 'kreatif' });
    setCustomActionText('');
  };

  const handleChoiceClick = (choice) => {
    setSelectedChoiceId(choice.id);
    audio.playClick();
    onChooseAction(choice);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-7 px-4 space-y-3 animate-fadeIn border border-white/5 rounded-2xl bg-slate-950/40 backdrop-blur-md">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-slate-800 border-t-amber-400 animate-spin" />
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        </div>
        <span className="font-cinzel text-amber-300 text-xs font-bold tracking-widest uppercase animate-pulse">
          Menenun Takdir...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Narrative Choices (Numbered 01, 02, 03) */}
      <div className="flex flex-col gap-2">
        {choices.map((choice, idx) => {
          const choiceNumber = String(idx + 1).padStart(2, '0');
          const hasReqItem = !choice.requiredItem || (character?.inventory || []).some(i => {
            if (!choice.requiredItem) return true;
            const req = String(choice.requiredItem).toLowerCase().trim();
            const itemId = String(i.id || '').toLowerCase().trim();
            const itemName = String(i.name || '').toLowerCase().trim();
            return itemId === req || itemName === req || itemName.includes(req) || req.includes(itemName);
          });
          const isSelected = selectedChoiceId === choice.id;

          return (
            <button
              key={choice.id || idx}
              disabled={!hasReqItem || isLoading}
              onClick={() => handleChoiceClick(choice)}
              className={`group relative px-4 py-3 rounded-xl border text-left flex items-start gap-3.5 transition-all duration-150 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer ${
                (!hasReqItem || isLoading)
                  ? 'bg-slate-950/30 border-slate-800/60 text-slate-500 opacity-50 cursor-not-allowed'
                  : isSelected
                  ? 'bg-amber-950/40 border-amber-400/80 text-amber-100 shadow-md ring-1 ring-amber-400/30'
                  : 'bg-slate-900/60 hover:bg-slate-800/70 border-white/10 hover:border-amber-400/40 text-slate-200 hover:text-white shadow-sm'
              }`}
            >
              {/* Number Cue (01, 02, 03) */}
              <div className="mt-0.5 px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0 text-amber-300/90 group-hover:text-amber-300 group-hover:border-amber-400/40 text-[11px] font-bold font-mono transition-colors">
                {choiceNumber}
              </div>

              {/* Choice Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] px-2 py-0.2 rounded-full bg-white/5 border border-white/10 text-slate-300 uppercase tracking-wider font-semibold">
                    {choice.tone || 'Aksi'}
                  </span>
                  {choice.requiredItem && !hasReqItem && (
                    <span className="text-[9px] px-2 py-0.2 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/50 uppercase font-semibold">
                      Butuh {choice.requiredItem}
                    </span>
                  )}
                </div>
                <p className="font-outfit text-xs md:text-[13px] font-medium leading-relaxed">
                  {choice.text}
                </p>
              </div>

              {/* Subtle Arrow Cue */}
              <div className="mt-1 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Roleplay Free Action Input */}
      <div className="mt-1 bg-slate-950/70 border border-white/10 focus-within:border-amber-400/60 rounded-xl p-2.5 shadow-lg transition-all backdrop-blur-md">
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={customActionText}
            onChange={(e) => setCustomActionText(e.target.value)}
            placeholder="Aksi bebas (misal: 'Aku memeriksa ukiran di dinding'...)"
            disabled={isLoading}
            aria-label="Input aksi peran bebas"
            className="flex-1 bg-white/5 focus:bg-white/10 border border-transparent focus:border-white/15 rounded-lg text-xs text-slate-100 placeholder-slate-500 px-3 py-2 outline-none font-outfit min-h-[40px] transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !customActionText.trim()}
            aria-label="Kirim Aksi Bebas"
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm min-h-[40px] flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Kirim Aksi"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-cinzel">Lakukan</span>
          </button>
        </form>
      </div>
    </div>
  );
}
