import React from 'react';
import { Volume2, VolumeX, Mic, MicOff, GitFork, Save, LogOut, MapPin } from 'lucide-react';
import audio from '../../services/audioService';

export default function SceneHeader({
  chapterTitle,
  location,
  soundEnabled,
  speechEnabled,
  onToggleSound,
  onToggleSpeech,
  onOpenStoryTree,
  onOpenSaveLoad,
  onExitSession
}) {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-3 md:px-6 py-2.5 md:py-3.5 flex items-center justify-between gap-3 pointer-events-none">
      {/* Location & Chapter Context: Minimal, atmospheric fantasy watermark */}
      <div className="flex items-center gap-2.5 bg-slate-950/70 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg pointer-events-auto">
        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-cinzel text-xs font-bold text-amber-200 tracking-wide">
          {chapterTitle || 'Babak I'}
        </span>
        <span className="text-white/20 text-xs">•</span>
        <span className="text-xs text-slate-300 font-medium truncate max-w-[130px] sm:max-w-[220px]">
          {location || 'Aetheria'}
        </span>
      </div>

      {/* Action Controls: Compact, floating, accessible tools */}
      <nav aria-label="Game Quick Controls" className="flex items-center gap-1 bg-slate-950/70 backdrop-blur-md border border-white/10 p-1 rounded-2xl shadow-xl pointer-events-auto">
        {/* SFX / Ambient Sound Toggle */}
        <button
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Matikan efek suara & audio suasana' : 'Nyalakan efek suara & audio suasana'}
          className={`p-2 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
            soundEnabled ? 'text-amber-300 hover:bg-white/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/10'
          }`}
          title={soundEnabled ? 'Matikan Audio' : 'Nyalakan Audio'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Neural / Speech Narration Toggle */}
        <button
          onClick={onToggleSpeech}
          aria-label={speechEnabled ? 'Matikan narasi suara karakter' : 'Nyalakan narasi suara karakter'}
          className={`p-2 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
            speechEnabled ? 'text-amber-300 bg-amber-500/20 border border-amber-400/40' : 'text-slate-500 hover:text-slate-300 hover:bg-white/10'
          }`}
          title={speechEnabled ? 'Matikan Narasi Suara' : 'Nyalakan Narasi Suara'}
        >
          {speechEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Story Tree & Rewind Modal Trigger */}
        <button
          onClick={() => {
            audio.playClick();
            onOpenStoryTree();
          }}
          aria-label="Lihat cabang takdir & fitur rewind"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all min-h-[44px] min-w-[44px] cursor-pointer"
          title="Pohon Cerita & Rewind"
        >
          <GitFork className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline font-cinzel">Takdir</span>
        </button>

        {/* Save / Load Modal Trigger */}
        <button
          onClick={() => {
            audio.playClick();
            onOpenSaveLoad();
          }}
          aria-label="Buka menu simpan dan muat permainan"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all min-h-[44px] min-w-[44px] cursor-pointer"
          title="Simpan & Muat"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline font-cinzel">Arsip</span>
        </button>

        {/* Exit Session Trigger */}
        <button
          onClick={() => {
            audio.playClick();
            if (window.confirm('Kembali ke menu utama? Progres petualanganmu tetap tersimpan otomatis.')) {
              onExitSession?.();
            }
          }}
          aria-label="Kembali ke menu utama"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 transition-all min-h-[44px] min-w-[44px] cursor-pointer"
          title="Menu Utama"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline font-cinzel">Keluar</span>
        </button>
      </nav>
    </header>
  );
}
