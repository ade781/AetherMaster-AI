import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, VolumeX, BookOpen, RotateCcw, Sparkles, MapPin, 
  Shield, Compass, Flame, Key, ChevronRight, Crown, Database
} from 'lucide-react';
import { audio } from '../services/audioService';
import { BacklogModal } from './BacklogModal';
import { SaveLoadModal } from './SaveLoadModal';

export function VisualNovelStage({ 
  currentScene, 
  onSelectChoice, 
  isLoading, 
  history = [], 
  sessionId,
  onRestart,
  onLoadSession 
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBacklogOpen, setIsBacklogOpen] = useState(false);
  const [isSaveLoadOpen, setIsSaveLoadOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const typingIndexRef = useRef(0);
  const typingTimerRef = useRef(null);

  const fullText = currentScene?.dialogue || '';

  // Typewriter effect on scene change
  useEffect(() => {
    if (!fullText) return;

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    setDisplayedText('');
    setIsTyping(true);
    typingIndexRef.current = 0;

    typingTimerRef.current = setInterval(() => {
      typingIndexRef.current += 1;
      setDisplayedText(fullText.slice(0, typingIndexRef.current));

      if (typingIndexRef.current >= fullText.length) {
        clearInterval(typingTimerRef.current);
        setIsTyping(false);
      }
    }, 20);

    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, [fullText]);

  const handleSkipTyping = () => {
    if (isTyping) {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
      setDisplayedText(fullText);
      setIsTyping(false);
      audio.playClick();
    }
  };

  // Keyboard hotkeys for choices (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLoading || isBacklogOpen || isSaveLoadOpen) return;
      const choices = currentScene?.choices || [];
      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= choices.length) {
        audio.playClick();
        onSelectChoice(choices[keyNum - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScene, isLoading, isBacklogOpen, isSaveLoadOpen, onSelectChoice]);

  const handleToggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      audio.startAmbient();
      audio.playClick();
    }
  };

  const getToneBadge = (tone) => {
    switch (tone) {
      case 'bold':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Tegas / Berani',
          className: 'bg-rose-950/60 border-rose-700/50 text-rose-300'
        };
      case 'cautious':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Waspada / Hati-hati',
          className: 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
        };
      case 'curious':
        return {
          icon: <Compass className="w-3.5 h-3.5 text-sky-400" />,
          label: 'Selidik / Tanya',
          className: 'bg-sky-950/60 border-sky-700/50 text-sky-300'
        };
      case 'shrewd':
      default:
        return {
          icon: <Key className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Taktis / Teliti',
          className: 'bg-amber-950/60 border-amber-700/50 text-amber-300'
        };
    }
  };

  const getSpeakerDetails = (speaker = '') => {
    const name = speaker.toLowerCase();
    if (name.includes('barkeep') || name.includes('barista') || name.includes('eldrin')) {
      return {
        title: 'Eldrin sang Barista',
        role: 'Pemilik Kedai Kurcaci',
        avatarBg: 'from-amber-800 to-amber-950',
        emoji: '🍺'
      };
    }
    if (name.includes('jubah') || name.includes('misterius') || name.includes('stranger')) {
      return {
        title: 'Sosok Berkerudung',
        role: 'Pengembara Hutan Hitam',
        avatarBg: 'from-purple-900 to-slate-950',
        emoji: '🗡️'
      };
    }
    if (name.includes('arwah') || name.includes('spirit') || name.includes('hantu')) {
      return {
        title: 'Siluet Arwah Rimba',
        role: 'Entitas Gaib Purba',
        avatarBg: 'from-cyan-900 to-slate-950',
        emoji: '👻'
      };
    }
    return {
      title: speaker || 'Dungeon Master',
      role: 'Narator Takdir',
      avatarBg: 'from-indigo-900 to-slate-950',
      emoji: '📜'
    };
  };

  const speakerInfo = getSpeakerDetails(currentScene?.speaker);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 md:p-8 max-w-6xl mx-auto select-none relative">
      {/* Top Bar / Navigation Controls */}
      <header className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-panel z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-600/40 flex items-center justify-center text-amber-400 font-serif font-bold text-lg shadow-inner">
            D&D
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-amber-300 font-serif">
              {currentScene?.chapterTitle || 'The Whispering Tavern'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>{currentScene?.location || 'The Whispering Hearth'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="capitalize text-slate-300">{currentScene?.mood || 'Misterius'}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className={`p-2.5 rounded-xl border transition-colors ${
              isMuted 
                ? 'border-slate-700 bg-slate-900/60 text-slate-500 hover:text-slate-300' 
                : 'border-amber-600/50 bg-amber-950/50 text-amber-300 hover:bg-amber-900/50'
            }`}
            title={isMuted ? 'Nyalakan Audio' : 'Matikan Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setIsSaveLoadOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/70 text-slate-300 hover:border-amber-500/50 hover:text-amber-300 text-xs font-medium transition-colors"
          >
            <Database className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Database Sesi</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setIsBacklogOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/70 text-slate-300 hover:border-amber-500/50 hover:text-amber-300 text-xs font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Riwayat ({history.length})</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Mulai petualangan baru dari awal?')) {
                audio.playClick();
                onRestart();
              }
            }}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-900/70 text-slate-400 hover:border-rose-500/50 hover:text-rose-400 transition-colors"
            title="Mulai Ulang Cerita"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Visual Stage */}
      <div className="flex-1 my-6 flex flex-col items-center justify-center relative min-h-[260px] md:min-h-[320px]">
        {/* Fantasy Backdrop */}
        <div className="w-full h-full absolute inset-0 rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-black -z-10 shadow-2xl">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-4 right-1/4 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
        </div>

        {/* Character Portrait */}
        <div className="flex flex-col items-center text-center z-10 character-breath">
          <div className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl p-1 bg-gradient-to-b ${speakerInfo.avatarBg} border-2 border-amber-500/50 shadow-2xl flex items-center justify-center relative mb-3`}>
            <span className="text-5xl md:text-6xl drop-shadow-md select-none">
              {speakerInfo.emoji}
            </span>
            <div className="absolute -bottom-2.5 px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-wider bg-slate-950 border-amber-500/80 text-amber-300">
              {speakerInfo.role}
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-serif font-bold tracking-tight text-white drop-shadow">
            {speakerInfo.title}
          </h2>
        </div>
      </div>

      {/* Narrative & Choices Card */}
      <section className="space-y-4 z-10">
        {currentScene?.consequenceNote && (
          <div className="px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-200 text-xs flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="italic">{currentScene.consequenceNote}</span>
          </div>
        )}

        {/* Dialogue Box */}
        <div 
          onClick={handleSkipTyping}
          className="p-5 md:p-7 rounded-2xl glass-panel border border-amber-500/30 cursor-pointer relative group transition-all"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-serif font-semibold tracking-wide mb-3">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentScene?.speaker || 'Dungeon Master'}</span>
          </div>

          <p className="text-base md:text-lg leading-relaxed text-slate-100 font-sans min-h-[70px]">
            {displayedText}
            {isTyping && <span className="typewriter-cursor" />}
          </p>

          <div className="mt-3 flex justify-end text-[11px] text-slate-500 group-hover:text-amber-400/80 transition-colors">
            {isTyping ? 'Klik di mana saja untuk lewati teks...' : 'Pilih tindakan Anda di bawah...'}
          </div>
        </div>

        {/* Choices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {isLoading ? (
            <>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse h-20" />
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse h-20" />
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse h-20" />
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse h-20" />
            </>
          ) : (
            currentScene?.choices?.map((choice, index) => {
              const tone = getToneBadge(choice.tone);
              return (
                <button
                  key={choice.id || index}
                  onClick={() => {
                    audio.playClick();
                    onSelectChoice(choice);
                  }}
                  className="glass-card text-left p-4 rounded-xl flex items-start justify-between gap-3 group active:scale-[0.98] transition-all"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono flex items-center justify-center group-hover:border-amber-500 group-hover:text-amber-300">
                        {index + 1}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${tone.className}`}>
                        {tone.icon}
                        <span>{tone.label}</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 group-hover:text-amber-200 transition-colors font-sans leading-snug">
                      {choice.text}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Backlog Modal */}
      <BacklogModal
        isOpen={isBacklogOpen}
        onClose={() => setIsBacklogOpen(false)}
        history={history}
      />

      {/* Save / Load Database Modal */}
      <SaveLoadModal
        isOpen={isSaveLoadOpen}
        onClose={() => setIsSaveLoadOpen(false)}
        onLoadSession={onLoadSession}
        activeSessionId={sessionId}
      />
    </div>
  );
}
