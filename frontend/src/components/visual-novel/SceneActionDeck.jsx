import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import audio from '../../services/audioService';

export default function SceneActionDeck({
  choices = [],
  character,
  isLoading,
  onChooseAction
}) {
  const [customActionText, setCustomActionText] = useState('');

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customActionText.trim() || isLoading) return;
    audio.playClick();
    onChooseAction({ id: 'custom', customText: customActionText.trim(), tone: 'kreatif' });
    setCustomActionText('');
  };

  const handleChoiceClick = (choice) => {
    audio.playClick();
    onChooseAction(choice);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-3 animate-fadeIn border border-white/5 rounded-2xl bg-black/20">
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
      {/* Prominent Free Action Input (Roleplay Bebas) */}
      <div className="bg-black/50 border border-amber-500/30 hover:border-amber-400/60 focus-within:border-amber-400 rounded-2xl p-3 shadow-xl transition-all backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Ketik Aksi Bebas (Roleplay)</span>
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold">
            ✨ Aksi Narasi Bebas
          </span>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={customActionText}
            onChange={(e) => setCustomActionText(e.target.value)}
            placeholder="Ketik aksimu... (misal: 'Aku menginterogasi pedagang', 'Aku merapalkan sihir', dll.)"
            disabled={isLoading}
            className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl text-xs md:text-sm text-slate-100 placeholder-slate-500 px-3.5 py-2.5 outline-none font-outfit min-h-[42px] transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !customActionText.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md min-h-[42px] flex items-center gap-1.5 flex-shrink-0"
            title="Kirim Aksi"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lakukan</span>
          </button>
        </form>
      </div>

      {/* Divider to Quick Suggested Actions */}
      {choices.length > 0 && (
        <div className="flex items-center gap-2 px-1 pt-1">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            atau pilih saran taktis
          </span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>
      )}

      {/* Quick Suggested Choices */}
      <div className="flex flex-col gap-2">
        {choices.map((choice, idx) => {
          const hasReqItem = !choice.requiredItem || (character?.inventory || []).some(i => {
            if (!choice.requiredItem) return true;
            const req = String(choice.requiredItem).toLowerCase().trim();
            const itemId = String(i.id || '').toLowerCase().trim();
            const itemName = String(i.name || '').toLowerCase().trim();
            return itemId === req || itemName === req || itemName.includes(req) || req.includes(itemName);
          });

          return (
            <button
              key={choice.id || idx}
              disabled={!hasReqItem || isLoading}
              onClick={() => handleChoiceClick(choice)}
              className={`px-3.5 py-2.5 rounded-xl border text-left flex items-start gap-3 transition-all min-h-[44px] ${
                (!hasReqItem || isLoading)
                  ? 'bg-black/40 border-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-amber-400/30 text-slate-200 hover:text-white shadow-sm hover:-translate-y-0.5'
              }`}
            >
              <div className="mt-0.5 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center flex-shrink-0 text-amber-300 text-[10px] font-bold font-cinzel">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 uppercase tracking-wider font-bold">
                    {choice.tone || 'Aksi'}
                  </span>
                  {choice.requiredItem && !hasReqItem && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-800/50 uppercase font-bold">
                      Butuh {choice.requiredItem}
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-[13px] font-medium leading-snug">
                  {choice.text}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
