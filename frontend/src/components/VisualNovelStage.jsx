import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2, VolumeX, Mic, MicOff, BookOpen, GitFork, Save,
  Sparkles, Send
} from 'lucide-react';
import audio from '../services/audioService';
import FantasyAvatar from './common/FantasyAvatar';

export default function VisualNovelStage({
  node,
  character,
  onChooseAction,
  onOpenStoryTree,
  onOpenBacklog,
  onOpenSaveLoad,
  onToggleInventory,
  isLoading,
  hudComponent
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [customActionText, setCustomActionText] = useState('');

  const fullText = node?.dialogueText || 'Kisahmu dimulai di alam semesta AetherMaster...';

  // Skip typewriter handler
  const handleSkipTypewriter = useCallback(() => {
    if (isTyping) {
      setDisplayedText(fullText);
      setIsTyping(false);
    }
  }, [isTyping, fullText]);

  // Keyboard shortcut listener: Space/Enter skips, I toggles inventory, M opens story tree, L opens backlog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleSkipTypewriter();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        audio.playClick();
        onToggleInventory?.();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        audio.playClick();
        onOpenStoryTree?.();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        audio.playClick();
        onOpenBacklog?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkipTypewriter, onToggleInventory, onOpenStoryTree, onOpenBacklog]);

  // Background music & ambient soundscape sync based on scene background
  useEffect(() => {
    const bgId = (node?.backgroundId || '').toLowerCase();
    if (bgId.includes('crypt') || bgId.includes('dungeon') || bgId.includes('graveyard') || bgId.includes('woods') || bgId.includes('vampire') || bgId.includes('shadow')) {
      audio.playBGM('dungeon');
    } else {
      audio.playBGM('tavern');
    }
  }, [node?.backgroundId]);

  // Typewriter effect
  useEffect(() => {
    if (!fullText) return;
    setIsTyping(true);
    setDisplayedText('');

    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setDisplayedText(fullText.slice(0, currentIdx));
      if (currentIdx >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15);

    // Voice narration via Web Speech API
    if (speechEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.rate = 1.0;
      utterance.pitch = 0.95;
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      clearInterval(interval);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [node?.id, fullText, speechEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.setMuted(!next);
  };

  const toggleSpeech = () => {
    const next = !speechEnabled;
    setSpeechEnabled(next);
    if (!next && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const getBackgroundSrc = (bgId) => {
    if (!bgId) return '/assets/backgrounds/bg_01_tavern.png';
    if (bgId.startsWith('/') || bgId.startsWith('http')) return bgId;
    return `/assets/backgrounds/${bgId}.png`;
  };

  const choices = node?.choices || [];

  return (
    <div className="relative w-full h-full flex flex-col lg:flex-row overflow-hidden bg-black select-none">

      {/* LEFT PANEL: Visual Stage (60% on desktop) */}
      <div className="relative flex-[3] xl:flex-[4] h-[40vh] lg:h-full overflow-hidden flex-shrink-0">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src={getBackgroundSrc(node?.backgroundId)}
            alt="Adventure Scene"
            className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05] transition-all duration-700 scale-[1.02]"
            onError={(e) => { e.target.src = '/assets/backgrounds/bg_01_tavern.png'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
        </div>

        {/* Top Stage Control Header */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 md:px-6 py-3 md:py-4 flex flex-wrap items-center justify-between gap-2">
          {/* Location & Chapter Pill */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-cinzel text-xs font-bold text-amber-300 tracking-wide drop-shadow-md">
              {node?.chapterTitle || 'Babak I: Takdir Dimulai'}
            </span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-xs text-slate-200 font-medium drop-shadow-md truncate max-w-[140px] sm:max-w-none">
              {node?.location || 'Aetheria'}
            </span>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-xl">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${soundEnabled ? 'text-amber-400 hover:bg-white/10' : 'text-slate-400 hover:bg-white/10'
                }`}
              title={soundEnabled ? 'Matikan SFX/Audio' : 'Nyalakan SFX/Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${speechEnabled ? 'text-amber-300 bg-white/10' : 'text-slate-400 hover:bg-white/10'
                }`}
              title={speechEnabled ? 'Matikan Narasi Suara' : 'Nyalakan Narasi Suara'}
            >
              {speechEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <div className="w-[1px] h-5 bg-white/20 my-auto" />
            <button
              onClick={() => { audio.playClick(); onOpenBacklog(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all min-h-[40px]"
              title="Buka Jurnal Misi & Prolog Petualang (Hotkey: L)"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Log</span>
            </button>
            <button
              onClick={() => { audio.playClick(); onOpenStoryTree(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all min-h-[40px]"
              title="Lihat Cabang Alur Cerita & Rewind (Hotkey: M)"
            >
              <GitFork className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Cabang</span>
            </button>
            <button
              onClick={() => { audio.playClick(); onOpenSaveLoad(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all min-h-[40px]"
              title="Simpan / Muat Permainan"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Simpan</span>
            </button>
          </div>
        </div>

        {/* Character Bust Sprite */}
        <div className="absolute bottom-0 right-4 md:right-12 z-10 flex items-end justify-center pointer-events-none">
          {node?.characterId && (
            <div className="w-64 md:w-80 lg:w-[420px] max-h-[85vh] flex items-end justify-center filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)] animate-fadeIn">
              <img
                src={`/assets/portraits/${node.characterId}.png`}
                alt={node.speaker || 'Karakter'}
                className="max-h-[85vh] object-contain object-bottom"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Story Dashboard (40% on desktop) */}
      <div className="relative flex-[2] xl:flex-[2] h-[60vh] lg:h-full flex flex-col bg-slate-950/95 border-l border-white/10 shadow-2xl z-20 overflow-hidden">

        {/* Insert Top HUD */}
        {hudComponent}

        {/* Scrollable Story & Choice Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 flex flex-col gap-5 scrollbar-hide">

          <div className="flex-1">
            {/* Consequence Note Banner */}
            {node?.consequenceNote && (
              <div className="mb-4 bg-amber-500/10 border-l-4 border-amber-400 px-4 py-3 rounded-r-xl flex items-start gap-3 text-sm text-amber-200 animate-slideDown shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{node.consequenceNote}</span>
              </div>
            )}

            {/* Main Dialogue Box */}
            <div
              onClick={handleSkipTypewriter}
              className="relative bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl cursor-pointer group hover:bg-white/10 transition-colors"
            >
              {/* Speaker Nameplate */}
              <div className="absolute -top-3 left-6 bg-slate-950/90 backdrop-blur-md border border-white/20 px-4 py-1 rounded-full shadow-lg flex items-center gap-2">
                <span className="font-cinzel text-xs font-bold text-amber-300 tracking-widest uppercase">
                  {node?.speaker || 'Dungeon Master'}
                </span>
                {node?.mood && (
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {node.mood}
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

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="hidden sm:inline text-slate-400">
                  Pintas: <kbd className="px-1 py-0.5 rounded bg-white/10 text-amber-300">Spasi</kbd> Lanjut • <kbd className="px-1 py-0.5 rounded bg-white/10 text-amber-300">I</kbd> Tas • <kbd className="px-1 py-0.5 rounded bg-white/10 text-cyan-300">M</kbd> Peta • <kbd className="px-1 py-0.5 rounded bg-white/10 text-amber-300">L</kbd> Log
                </span>
                <span className="tracking-wider uppercase ml-auto">
                  {isTyping ? 'Klik / Spasi Percepat' : 'Pilih tindakan di bawah'}
                </span>
              </div>
            </div>
          </div>

          {/* Choice Deck */}
          <div className="mt-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-3 animate-fadeIn border border-white/5 rounded-2xl bg-black/20">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-slate-800 border-t-amber-400 animate-spin"></div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                </div>
                <span className="font-cinzel text-amber-300 text-xs font-bold tracking-widest uppercase animate-pulse">
                  Menenun Takdir...
                </span>
              </div>
            ) : (
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

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!customActionText.trim() || isLoading) return;
                      audio.playClick();
                      onChooseAction({ id: 'custom', customText: customActionText.trim(), tone: 'kreatif' });
                      setCustomActionText('');
                    }}
                    className="flex items-center gap-2"
                  >
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
                        disabled={!hasReqItem}
                        onClick={() => {
                          audio.playClick();
                          onChooseAction(choice);
                        }}
                        className={`px-3.5 py-2.5 rounded-xl border text-left flex items-start gap-3 transition-all min-h-[44px] ${!hasReqItem
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
