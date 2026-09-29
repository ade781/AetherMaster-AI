import React from 'react';
import { Volume2, VolumeX, Mic, MicOff, GitFork, Save, LogOut } from 'lucide-react';
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
    <div className="absolute top-0 left-0 right-0 z-20 px-4 md:px-6 py-3 md:py-4 flex flex-wrap items-center justify-between gap-2">
      {/* Location & Chapter Pill */}
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span className="font-cinzel text-xs font-bold text-amber-300 tracking-wide drop-shadow-md">
          {chapterTitle || 'Babak I: Takdir Dimulai'}
        </span>
        <span className="text-white/40 text-xs">•</span>
        <span className="text-xs text-slate-200 font-medium drop-shadow-md truncate max-w-[140px] sm:max-w-none">
          {location || 'Aetheria'}
        </span>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-xl">
        {/* SFX / Ambient Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${
            soundEnabled ? 'text-amber-400 hover:bg-white/10' : 'text-slate-400 hover:bg-white/10'
          }`}
          title={soundEnabled ? 'Matikan SFX/Audio' : 'Nyalakan SFX/Audio'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Speech Narration Toggle */}
        <button
          onClick={onToggleSpeech}
          className={`p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${
            speechEnabled ? 'text-amber-300 bg-white/10' : 'text-slate-400 hover:bg-white/10'
          }`}
          title={speechEnabled ? 'Matikan Narasi Suara' : 'Nyalakan Narasi Suara'}
        >
          {speechEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Story Tree & Rewind */}
        <button
          onClick={() => {
            audio.playClick();
            onOpenStoryTree();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all min-h-[40px]"
          title="Lihat Cabang Alur Cerita & Rewind"
        >
          <GitFork className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Cabang</span>
        </button>

        {/* Save / Load */}
        <button
          onClick={() => {
            audio.playClick();
            onOpenSaveLoad();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all min-h-[40px]"
          title="Simpan / Muat Permainan"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Simpan</span>
        </button>

        {/* Exit Session */}
        <button
          onClick={() => {
            audio.playClick();
            if (window.confirm('Kembali ke menu utama? Progres petualanganmu tetap tersimpan otomatis.')) {
              onExitSession?.();
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-all min-h-[40px]"
          title="Kembali ke Menu Utama"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </div>
  );
}
