import React, { useState, useEffect } from 'react';
import { CharacterCreator } from '../components/character/CharacterCreator';
import { CharacterSheet } from '../components/character/CharacterSheet';
import { StorySelector } from '../components/story/StorySelector';
import { AdventurePlayground } from '../components/story/AdventurePlayground';
import { DiceBox } from '../components/dice/DiceBox';
import { Shield, Plus, Sparkles, Play, BookOpen, User, RefreshCw } from 'lucide-react';

export const DashboardPage = () => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list'); // 'list' | 'create' | 'sheet' | 'stories' | 'play'
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);

  const fetchCharacters = async () => {
    try {
      const res = await fetch('/api/characters');
      const data = await res.json();
      if (data.success) {
        setCharacters(data.data);
        if (data.data.length > 0 && !selectedCharacter) {
          setSelectedCharacter(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil daftar karakter', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleCharacterCreated = (newChar) => {
    setCharacters(prev => [newChar, ...prev]);
    setSelectedCharacter(newChar);
    setActiveView('sheet');
  };

  const handleCharacterUpdated = (updatedChar) => {
    setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
    setSelectedCharacter(updatedChar);
  };

  const handleDeleteCharacter = async (charId) => {
    if (!window.confirm('Apakah kamu yakin ingin memusnahkan karakter pahlawan ini?')) return;
    try {
      await fetch(`/api/characters/${charId}`, {
        method: 'DELETE',
      });
      setCharacters(prev => prev.filter(c => c.id !== charId));
      if (selectedCharacter?.id === charId) {
        setSelectedCharacter(null);
      }
      setActiveView('list');
    } catch (err) {
      console.error('Gagal menghapus karakter', err);
    }
  };

  const handleSelectStoryToPlay = (story) => {
    setSelectedStory(story);
    // If no character selected, prompt user or auto create default
    if (!selectedCharacter && characters.length > 0) {
      setSelectedCharacter(characters[0]);
    }
    setActiveView('play');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-outfit">
      {/* Top Navbar */}
      <header className="bg-slate-950/95 border-b border-fantasy-border/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex justify-between items-center shadow-lg">
        <div
          onClick={() => setActiveView('list')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-gold-glow group-hover:scale-105 transition-transform">
            <Shield size={20} className="text-slate-950" />
          </div>
          <div>
            <h1 className="font-cinzel text-fantasy-gold text-lg font-black tracking-wider leading-none">
              AetherMaster AI
            </h1>
            <span className="text-[10px] text-slate-400 font-medium">Virtual Tabletop & AI Dungeon Master</span>
          </div>
        </div>

        {/* Top Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setActiveView('stories')}
            className={`font-cinzel font-bold text-xs px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all ${
              activeView === 'stories' || activeView === 'play'
                ? 'bg-amber-950/80 text-fantasy-gold border-fantasy-gold shadow-gold-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-fantasy-gold/50'
            }`}
          >
            <BookOpen size={14} className="text-fantasy-gold" /> Modul Cerita
          </button>

          <button
            type="button"
            onClick={() => setActiveView('list')}
            className={`font-cinzel font-bold text-xs px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all ${
              activeView === 'list' || activeView === 'sheet'
                ? 'bg-amber-950/80 text-fantasy-gold border-fantasy-gold shadow-gold-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-fantasy-gold/50'
            }`}
          >
            <User size={14} className="text-fantasy-gold" /> Daftar Pahlawan
          </button>

          <button
            type="button"
            onClick={() => setActiveView('create')}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase px-4 py-2 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} /> Karakter Baru
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          {/* Main Dynamic View Area */}
          <div>
            {activeView === 'stories' && (
              <StorySelector
                selectedCharacter={selectedCharacter}
                onSelectStory={handleSelectStoryToPlay}
              />
            )}

            {activeView === 'play' && selectedStory && (
              <AdventurePlayground
                character={selectedCharacter || { name: 'Petualang Pengembara', currentHp: 12, maxHp: 12, armorClass: 12 }}
                story={selectedStory}
                onExit={() => setActiveView('stories')}
              />
            )}

            {activeView === 'create' && (
              <CharacterCreator
                onCreated={handleCharacterCreated}
                onCancel={() => setActiveView('list')}
              />
            )}

            {activeView === 'sheet' && selectedCharacter && (
              <CharacterSheet
                character={selectedCharacter}
                onBack={() => setActiveView('list')}
                onUpdate={handleCharacterUpdated}
                onDelete={handleDeleteCharacter}
              />
            )}

            {activeView === 'list' && (
              <div className="space-y-6">
                {/* Banner Header */}
                <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-800 gap-4">
                  <div>
                    <h2 className="font-cinzel text-fantasy-gold text-2xl font-bold tracking-wide">
                      Balairung Pahlawan (Adventurer's Hall)
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                      Pilih karakter D&D 5E untuk melihat lembar status hidup atau mulai bertualang dalam cerita
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('stories')}
                      className="bg-amber-950/60 hover:bg-amber-900/80 text-fantasy-gold font-cinzel font-bold text-xs px-4 py-2 rounded-xl border border-fantasy-border flex items-center gap-1.5 transition-all"
                    >
                      <BookOpen size={14} /> Pilih Cerita Petualangan
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-16 text-fantasy-gold">
                    <Sparkles className="animate-spin mx-auto mb-3" size={32} />
                    <div className="font-cinzel text-sm font-semibold">Memanggil Data Pahlawan dari Arsip MySQL...</div>
                  </div>
                ) : characters.length === 0 ? (
                  <div className="glass-card rounded-2xl p-10 sm:p-14 text-center border border-fantasy-border/60">
                    <div className="text-5xl mb-4">⚔️</div>
                    <h3 className="font-cinzel text-fantasy-gold text-xl font-bold mb-2">Belum Ada Karakter Pahlawan</h3>
                    <p className="text-slate-400 max-w-md mx-auto text-xs sm:text-sm mb-6 leading-relaxed">
                      Daftar partymu masih kosong. Tempa karakter D&D 5E pertamamu sekarang dan mulailah petualangan epik!
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveView('create')}
                      className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase px-6 py-3 rounded-xl shadow-gold-glow inline-flex items-center gap-2"
                    >
                      <Plus size={16} /> Tempa Pahlawan Pertama
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {characters.map((char) => (
                      <div
                        key={char.id}
                        onClick={() => {
                          setSelectedCharacter(char);
                          setActiveView('sheet');
                        }}
                        className="glass-card rounded-2xl p-5 border border-fantasy-border/60 hover:border-fantasy-gold cursor-pointer transition-all flex flex-col justify-between group shadow-lg"
                      >
                        <div className="flex gap-3.5 items-center mb-3">
                          <img
                            src={char.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${char.name}`}
                            alt={char.name}
                            className="w-14 h-14 rounded-xl border border-fantasy-gold bg-slate-900 group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <h3 className="font-cinzel text-fantasy-gold text-base font-bold group-hover:text-amber-300 transition-colors">
                              {char.name}
                            </h3>
                            <div className="text-xs text-slate-400">
                              Tingkat {char.level} • {char.race} {char.characterClass}
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl text-center mb-4 border border-slate-800/80">
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold">HP</div>
                            <div className="text-sm font-black font-cinzel text-rose-400">{char.currentHp}/{char.maxHp}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold">ARMOR</div>
                            <div className="text-sm font-black font-cinzel text-sky-400">{char.armorClass}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold">LANGKAH</div>
                            <div className="text-sm font-black font-cinzel text-emerald-400">{char.speed}ft</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCharacter(char);
                              setActiveView('sheet');
                            }}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-xl border border-slate-700 transition-all text-center"
                          >
                            Buka Lembar
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCharacter(char);
                              setActiveView('stories');
                            }}
                            className="bg-amber-600/30 hover:bg-amber-600/50 text-fantasy-gold p-2 rounded-xl border border-fantasy-gold/40 transition-all"
                            title="Mulai Petualangan dengan Karakter Ini"
                          >
                            <Play size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Persistent Sidebar: 3D Physics Dice Box */}
          <aside className="lg:sticky lg:top-20 space-y-4">
            <DiceBox />

            {/* Quick Helper Widget */}
            <div className="glass-card rounded-xl p-4 border border-fantasy-border/50 text-xs space-y-2">
              <div className="font-cinzel text-fantasy-gold font-bold flex items-center gap-1.5">
                <Sparkles size={14} /> Panduan Cepat Melempar
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Gunakan dadu **D20** untuk *Ability Check*, *Attack Roll*, dan *Saving Throw*. Dadu **D4, D6, D8, D10, D12** untuk damage senjata & sihir.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
