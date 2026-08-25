import React, { useState, useEffect } from 'react';
import { CharacterCreator } from '../components/character/CharacterCreator';
import { CharacterSheet } from '../components/character/CharacterSheet';
import { StorySelector } from '../components/story/StorySelector';
import { AdventurePlayground } from '../components/story/AdventurePlayground';
import { WorldMapExplorer } from '../components/map/WorldMapExplorer';
import { BattleGridMap } from '../components/combat/BattleGridMap';
import { CampaignStudio } from '../components/studio/CampaignStudio';
import { MerchantShop } from '../components/economy/MerchantShop';
import { CraftingStation } from '../components/crafting/CraftingStation';
import { CampfireRest } from '../components/campfire/CampfireRest';
import { RoguelikeDungeonCrawler } from '../components/dungeon/RoguelikeDungeonCrawler';
import { StoryChronicleNovelizer } from '../components/chronicle/StoryChronicleNovelizer';
import { HallOfFame } from '../components/legacy/HallOfFame';
import { DmDeveloperConsole } from '../components/console/DmDeveloperConsole';
import { DiceBox } from '../components/dice/DiceBox';
import {
  Shield, Plus, Sparkles, Play, BookOpen, User, Map, Swords,
  Hammer, Store, FlaskConical, Flame, Compass, Trophy, Scroll,
  RefreshCw, Dices, ChevronRight, ArrowLeft
} from 'lucide-react';

export const DashboardPage = () => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);

  // Clean Sequential Flow State:
  // 'onboarding_create' -> 'onboarding_choose_story' -> 'adventure' | 'world'
  const [appStage, setAppStage] = useState('loading'); // 'onboarding_create' | 'onboarding_choose_story' | 'main'
  const [mainTab, setMainTab] = useState('adventure'); // 'adventure' | 'sheet' | 'combat' | 'dungeon' | 'shop' | 'craft' | 'camp' | 'map' | 'studio' | 'chronicle' | 'hall'
  const [showDiceTrayModal, setShowDiceTrayModal] = useState(false);

  const fetchCharacters = async () => {
    try {
      const res = await fetch('/api/characters');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setCharacters(data.data);
        setSelectedCharacter(data.data[0]);
        setAppStage('main');
      } else {
        // First time user: Force create character first
        setAppStage('onboarding_create');
      }
    } catch (err) {
      console.error('Gagal mengambil karakter', err);
      setAppStage('onboarding_create');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  // STEP 1 COMPLETE: Character Created -> Move to Step 2: Choose Story
  const handleCharacterCreated = (newChar) => {
    setCharacters((prev) => [newChar, ...prev]);
    setSelectedCharacter(newChar);
    setAppStage('onboarding_choose_story');
  };

  // STEP 2 COMPLETE: Story Selected -> Move to Main Adventure Game
  const handleStorySelected = (story) => {
    setSelectedStory(story);
    setAppStage('main');
    setMainTab('adventure');
  };

  const handleCharacterUpdated = (updatedChar) => {
    setCharacters((prev) => prev.map((c) => (c.id === updatedChar.id ? updatedChar : c)));
    if (selectedCharacter?.id === updatedChar.id) {
      setSelectedCharacter(updatedChar);
    }
  };

  const handleDeleteCharacter = async (charId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus karakter ini?')) return;
    try {
      await fetch(`/api/characters/${charId}`, { method: 'DELETE' });
      const remaining = characters.filter((c) => c.id !== charId);
      setCharacters(remaining);
      if (remaining.length === 0) {
        setSelectedCharacter(null);
        setAppStage('onboarding_create');
      } else {
        setSelectedCharacter(remaining[0]);
      }
    } catch (err) {}
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-fantasy-gold font-outfit">
        <Sparkles className="animate-spin mb-4 text-fantasy-gold" size={40} />
        <h2 className="font-cinzel text-lg font-bold">Mempersiapkan Alam Semesta Aetheria...</h2>
      </div>
    );
  }

  // ONBOARDING STEP 1: Forced Character Creation First
  if (appStage === 'onboarding_create') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-outfit p-4 sm:p-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-3xl">
          <CharacterCreator
            onCreated={handleCharacterCreated}
            isFirstTime={true}
          />
        </div>
      </div>
    );
  }

  // ONBOARDING STEP 2: Forced Story Selection
  if (appStage === 'onboarding_choose_story') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-outfit p-4 sm:p-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-4xl space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-fantasy-border text-center space-y-2">
            <span className="text-xs text-fantasy-gold font-bold uppercase tracking-widest">
              LANGKAH 2 DARI 2: TENTUKAN MISI PERDANA
            </span>
            <h2 className="font-cinzel text-fantasy-gold text-2xl sm:text-3xl font-black">
              Pilih Alur Kisah Awal untuk {selectedCharacter?.name}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
              Setiap petualangan memiliki tantangan, misteri, dan hadiah jarahan yang berbeda.
            </p>
          </div>

          <StorySelector
            selectedCharacter={selectedCharacter}
            onSelectStory={handleStorySelected}
          />
        </div>
      </div>
    );
  }

  // MAIN GAME HUB (After Onboarding is Completed)
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-outfit">
      {/* Clean Top Navigation Bar */}
      <header className="border-b border-fantasy-border/80 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-40 shadow-xl">
        {/* Brand */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => setMainTab('adventure')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-gold-glow">
            <Shield className="text-slate-950" size={20} />
          </div>
          <div>
            <h1 className="font-cinzel text-fantasy-gold text-base sm:text-lg font-black tracking-wider leading-none">
              AETHERMASTER AI
            </h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Virtual Tabletop & AI DM
            </span>
          </div>
        </div>

        {/* Primary Feature Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setMainTab('adventure')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'adventure'
                ? 'bg-amber-950/80 text-fantasy-gold border-fantasy-gold shadow-gold-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-fantasy-gold/50'
            }`}
          >
            <BookOpen size={13} className="text-fantasy-gold" /> Petualangan AI
          </button>

          <button
            type="button"
            onClick={() => setMainTab('sheet')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'sheet'
                ? 'bg-amber-950/80 text-fantasy-gold border-fantasy-gold shadow-gold-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-fantasy-gold/50'
            }`}
          >
            <User size={13} className="text-fantasy-gold" /> Lembar Pahlawan
          </button>

          <button
            type="button"
            onClick={() => setMainTab('combat')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'combat'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-crimson-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-rose-500/50'
            }`}
          >
            <Swords size={13} className="text-rose-400" /> Mode Tempur
          </button>

          <button
            type="button"
            onClick={() => setMainTab('dungeon')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'dungeon'
                ? 'bg-amber-950/80 text-fantasy-gold border-fantasy-gold shadow-gold-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-fantasy-gold/50'
            }`}
          >
            <Compass size={13} className="text-amber-400" /> Labirin Acak
          </button>

          <button
            type="button"
            onClick={() => setMainTab('camp')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'camp'
                ? 'bg-amber-950/80 text-fantasy-gold border-fantasy-gold shadow-gold-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-fantasy-gold/50'
            }`}
          >
            <Flame size={13} className="text-amber-400" /> Perkemahan
          </button>

          <button
            type="button"
            onClick={() => setMainTab('shop')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'shop'
                ? 'bg-amber-950/80 text-fantasy-gold border-fantasy-gold shadow-gold-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-fantasy-gold/50'
            }`}
          >
            <Store size={13} className="text-fantasy-gold" /> Toko Pasar
          </button>

          <button
            type="button"
            onClick={() => setMainTab('craft')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'craft'
                ? 'bg-purple-950/80 text-purple-300 border-purple-500 shadow-arcane-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-purple-500/50'
            }`}
          >
            <FlaskConical size={13} className="text-purple-400" /> Alkimia
          </button>

          <button
            type="button"
            onClick={() => setMainTab('map')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'map'
                ? 'bg-amber-950/80 text-fantasy-gold border-fantasy-gold shadow-gold-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-fantasy-gold/50'
            }`}
          >
            <Map size={13} className="text-fantasy-gold" /> Peta
          </button>

          <button
            type="button"
            onClick={() => setMainTab('chronicle')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'chronicle'
                ? 'bg-amber-950/80 text-fantasy-gold border-fantasy-gold shadow-gold-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-fantasy-gold/50'
            }`}
          >
            <Scroll size={13} className="text-amber-400" /> Novel
          </button>

          <button
            type="button"
            onClick={() => setMainTab('hall')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'hall'
                ? 'bg-amber-950/80 text-fantasy-gold border-fantasy-gold shadow-gold-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-fantasy-gold/50'
            }`}
          >
            <Trophy size={13} className="text-amber-400" /> Aula
          </button>

          <button
            type="button"
            onClick={() => setMainTab('studio')}
            className={`font-cinzel font-bold text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              mainTab === 'studio'
                ? 'bg-purple-950/80 text-purple-300 border-purple-500 shadow-arcane-glow'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:border-purple-500/50'
            }`}
          >
            <Hammer size={13} className="text-purple-400" /> Studio
          </button>
        </div>

        {/* Active Hero Pill & 3D Dice Tray Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDiceTrayModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-fantasy-gold border border-fantasy-gold/40 px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Buka Kotak Dadu 3D Fisik"
          >
            <Dices size={14} /> Kotak Dadu 3D
          </button>

          {selectedCharacter && (
            <div
              onClick={() => setMainTab('sheet')}
              className="flex items-center gap-2 bg-slate-900/90 border border-fantasy-gold/40 px-2.5 py-1 rounded-xl cursor-pointer hover:border-fantasy-gold transition-all"
            >
              <img
                src={selectedCharacter.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedCharacter.name}`}
                alt={selectedCharacter.name}
                className="w-7 h-7 rounded-lg border border-fantasy-gold object-cover"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-200 line-clamp-1">{selectedCharacter.name}</div>
                <div className="text-[10px] text-rose-400 font-semibold leading-none">
                  {selectedCharacter.currentHp}/{selectedCharacter.maxHp} HP
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Game Screen Canvas */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {mainTab === 'adventure' && (
          selectedStory ? (
            <AdventurePlayground
              character={selectedCharacter}
              story={selectedStory}
              onExit={() => setAppStage('onboarding_choose_story')}
              onUpdateCharacter={handleCharacterUpdated}
            />
          ) : (
            <StorySelector
              selectedCharacter={selectedCharacter}
              onSelectStory={handleStorySelected}
            />
          )
        )}

        {mainTab === 'sheet' && selectedCharacter && (
          <CharacterSheet
            character={selectedCharacter}
            onBack={() => setMainTab('adventure')}
            onUpdate={handleCharacterUpdated}
            onDelete={handleDeleteCharacter}
          />
        )}

        {mainTab === 'combat' && (
          <BattleGridMap
            character={selectedCharacter}
            onExitCombat={() => setMainTab('adventure')}
            onUpdateCharacter={handleCharacterUpdated}
          />
        )}

        {mainTab === 'dungeon' && (
          <RoguelikeDungeonCrawler
            character={selectedCharacter}
            onUpdateCharacter={handleCharacterUpdated}
          />
        )}

        {mainTab === 'camp' && (
          <CampfireRest
            character={selectedCharacter}
            onUpdateCharacter={handleCharacterUpdated}
          />
        )}

        {mainTab === 'shop' && (
          <MerchantShop
            character={selectedCharacter}
            onUpdateCharacter={handleCharacterUpdated}
          />
        )}

        {mainTab === 'craft' && (
          <CraftingStation
            character={selectedCharacter}
            onUpdateCharacter={handleCharacterUpdated}
          />
        )}

        {mainTab === 'map' && (
          <WorldMapExplorer
            onTravelLocation={(loc) => {
              setMainTab('adventure');
            }}
          />
        )}

        {mainTab === 'chronicle' && (
          <StoryChronicleNovelizer
            character={selectedCharacter}
            story={selectedStory}
          />
        )}

        {mainTab === 'hall' && (
          <HallOfFame characters={characters} />
        )}

        {mainTab === 'studio' && (
          <CampaignStudio />
        )}
      </main>

      {/* Floating 3D Dice Box Modal (Hanya muncul saat dibuka / dibutuhkan, tidak memenuhi layar) */}
      {showDiceTrayModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-lg w-full p-6 border-2 border-fantasy-gold shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-2">
                <Dices size={16} /> Kotak Dadu Fisik 3D Three.js
              </h3>
              <button
                type="button"
                onClick={() => setShowDiceTrayModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Tutup ✕
              </button>
            </div>
            <DiceBox />
          </div>
        </div>
      )}

      {/* Floating Developer Macro Console */}
      <DmDeveloperConsole
        character={selectedCharacter}
        onUpdateCharacter={handleCharacterUpdated}
      />
    </div>
  );
};
