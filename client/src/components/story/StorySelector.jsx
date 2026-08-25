import React, { useState } from 'react';
import { PRESET_STORIES } from '../../data/stories';
import { BookOpen, Sparkles, Compass, Swords, Shield, ChevronRight, Play, ArrowLeft } from 'lucide-react';

export const StorySelector = ({ onSelectStory, selectedCharacter }) => {
  const [selectedStory, setSelectedStory] = useState(null);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'preview'

  const handleStartAdventure = (story) => {
    if (onSelectStory) {
      onSelectStory(story);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="font-cinzel text-fantasy-gold text-2xl font-bold tracking-wide flex items-center gap-2">
            <BookOpen size={24} /> Pilih Modul Cerita Petualangan
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Pilih skenario petualangan yang disediakan oleh AI Dungeon Master untuk memulai quest epik
          </p>
        </div>

        {selectedCharacter && (
          <div className="flex items-center gap-2.5 bg-slate-900/80 border border-fantasy-border px-3.5 py-1.5 rounded-xl">
            <img
              src={selectedCharacter.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedCharacter.name}`}
              alt={selectedCharacter.name}
              className="w-7 h-7 rounded-lg border border-fantasy-gold"
            />
            <div className="text-xs">
              <span className="text-slate-400">Pahlawan Aktif: </span>
              <strong className="text-fantasy-gold">{selectedCharacter.name}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Story Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRESET_STORIES.map((story) => (
          <div
            key={story.id}
            className="glass-card rounded-2xl overflow-hidden border border-fantasy-border/60 hover:border-fantasy-gold/60 transition-all flex flex-col justify-between group shadow-xl"
          >
            {/* Cover Image Banner */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={story.cover}
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              {/* Category & Difficulty Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="bg-slate-900/90 text-fantasy-gold text-[11px] font-bold px-2.5 py-1 rounded-md border border-fantasy-gold/30">
                  {story.category}
                </span>
                <span className="bg-slate-900/90 text-amber-300 text-[11px] font-medium px-2.5 py-1 rounded-md border border-slate-700">
                  {story.difficulty}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-cinzel text-fantasy-gold text-lg font-bold group-hover:text-amber-300 transition-colors">
                  {story.title}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                  {story.description}
                </p>

                {/* Location */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Compass size={14} className="text-fantasy-gold" />
                  <span>Lokasi Awal: <strong className="text-slate-200">{story.startingLocation}</strong></span>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {story.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-900/70 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/80 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStory(story)}
                  className="flex-1 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 transition-all text-center"
                >
                  Lihat Rincian Quest
                </button>
                <button
                  type="button"
                  onClick={() => handleStartAdventure(story)}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl shadow-gold-glow flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play size={14} /> Main Cerita Ini
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Story Detail Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-2xl w-full p-6 border border-fantasy-gold shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-fantasy-gold uppercase font-bold tracking-widest">{selectedStory.category}</span>
                <h3 className="font-cinzel text-fantasy-gold text-2xl font-black mt-0.5">{selectedStory.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                className="text-slate-400 hover:text-slate-100 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              {selectedStory.description}
            </p>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-cinzel text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> Prolog & Pengantar Cerita
              </h4>
              <p className="text-slate-200 text-xs italic leading-relaxed">
                "{selectedStory.introPrompt}"
              </p>
            </div>

            <div>
              <h4 className="font-cinzel text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">
                Opsi Pilihan Aksi Awal Pemain:
              </h4>
              <div className="space-y-2">
                {selectedStory.initialChoices.map((choice, i) => (
                  <div key={choice.id} className="text-xs bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-start gap-2.5 text-slate-300">
                    <span className="bg-fantasy-gold/20 text-fantasy-gold font-bold px-1.5 py-0.5 rounded text-[10px]">{i + 1}</span>
                    <span>{choice.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = selectedStory;
                  setSelectedStory(null);
                  handleStartAdventure(s);
                }}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase px-5 py-2.5 rounded-xl shadow-gold-glow flex items-center gap-2"
              >
                <Play size={14} /> Mulai Petualangan ⚔️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
