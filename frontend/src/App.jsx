import React, { useState, useEffect } from 'react';
import CharacterHUD from './components/CharacterHUD';
import VisualNovelStage from './components/VisualNovelStage';
import CharacterCreationModal from './components/CharacterCreationModal';
import StoryTreeModal from './components/StoryTreeModal';
import BacklogModal from './components/BacklogModal';
import SaveLoadModal from './components/SaveLoadModal';
import audio from './services/audioService';
import { Shield, Sparkles, BookOpen, Skull, Play, RefreshCw, Compass } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/story';

export default function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [session, setSession] = useState(null);
  const [character, setCharacter] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);

  // Modals & Overlays
  const [isCharCreationOpen, setIsCharCreationOpen] = useState(false);
  const [isStoryTreeOpen, setIsStoryTreeOpen] = useState(false);
  const [isBacklogOpen, setIsBacklogOpen] = useState(false);
  const [isSaveLoadOpen, setIsSaveLoadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch campaigns on mount
  useEffect(() => {
    fetch(`${API_BASE}/campaigns`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCampaigns(data.data || []);
        }
      })
      .catch(err => console.error('Gagal mengambil kampanye:', err))
      .finally(() => setInitLoading(false));
  }, []);

  // Handler: Start campaign & character creation
  const handleSelectCampaign = (camp) => {
    audio.playSelect();
    setSelectedCampaign(camp);
    setIsCharCreationOpen(true);
  };

  const handleStartGame = async (characterData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          characterData
        })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.data.session);
        setCharacter(data.data.character);
        setCurrentNode(data.data.currentNode);
        setIsCharCreationOpen(false);
      } else {
        showToast(data.error || 'Gagal memulai petualangan.', 'error');
      }
    } catch (err) {
      showToast('Koneksi ke backend gagal.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Choice action chosen in Visual Novel Stage
  const handleChooseAction = async (choice) => {
    if (!session || isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          choiceId: choice.id,
          statType: choice.statType,
          dc: choice.dc,
          customText: choice.customText
        })
      });

      const data = await res.json();
      if (data.success) {
        const nextNode = data.data.currentNode;
        const nextChar = data.data.character;
        const nextSess = data.data.session;

        setSession(nextSess);
        setCharacter(nextChar);
        setCurrentNode(nextNode);
      } else {
        showToast(data.error || 'Gagal mengambil tindakan.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan komunikasi dengan server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Inventory use item
  const handleUseItem = (item) => {
    if (!character) return;
    
    // Smart Item Check
    if (item.category !== 'Obat' && item.category !== 'Potion') {
      showToast(`${item.name} tidak bisa dikonsumsi langsung. Gunakan melalui dialog/pilihan!`, 'error');
      audio.playClick();
      return;
    }

    audio.playSelect();
    const inv = [...(character.inventory || [])];
    const idx = inv.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      inv.splice(idx, 1);
      
      // Determine effect (basic implementation for HP/Mana)
      let updated = { ...character, inventory: inv };
      if (item.name.toLowerCase().includes('mana') || item.effect.toLowerCase().includes('mana')) {
        updated.mana = Math.min(character.maxMana, character.mana + 25);
        showToast(`Memulihkan Mana dari ${item.name}!`, 'success');
      } else {
        updated.hp = Math.min(character.maxHp, character.hp + 25);
        showToast(`Memulihkan HP dari ${item.name}!`, 'success');
      }
      
      setCharacter(updated);
    }
  };

  // Handler: Rewind to node
  const handleRewind = async (targetNodeId) => {
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rewind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          targetNodeId
        })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.data.session);
        setCharacter(data.data.character);
        setCurrentNode(data.data.currentNode);
      }
    } catch (err) {
      console.error('Rewind error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Load from slot or import
  const handleLoadSession = (loadedData) => {
    setSession(loadedData.session);
    setCharacter(loadedData.character);
    setCurrentNode(loadedData.currentNode);
  };

  // Render Toast
  const ToastNotification = () => {
    if (!toast) return null;
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slideDown">
        <div className={`px-4 py-2 rounded-xl shadow-2xl border flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      </div>
    );
  };

  // Home Screen: Campaign Selection
  if (!session || !currentNode) {
    return (
      <div className="min-h-screen bg-fantasy-dark text-slate-100 flex flex-col justify-between selection:bg-fantasy-gold selection:text-slate-950">
        <ToastNotification />
        {/* Top Header */}
        <header className="w-full border-b border-fantasy-border/60 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fantasy-gold to-amber-600 flex items-center justify-center shadow-lg shadow-fantasy-gold/20 text-slate-950 font-bold font-cinzel text-xl">
              ⚔
            </div>
            <div>
              <h1 className="font-cinzel text-lg md:text-xl font-bold text-fantasy-gold tracking-wider">
                AetherMaster AI
              </h1>
              <p className="text-[11px] text-slate-400">Virtual Tabletop D&D 5E AI Engine</p>
            </div>
          </div>
          <button
            onClick={() => setIsSaveLoadOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Muat Save Game
          </button>
        </header>

        {/* Campaign Hero Area */}
        <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fantasy-gold/10 border border-fantasy-gold/30 text-fantasy-gold text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              D&D 5E Visual Novel Tabletop
            </div>
            <h2 className="font-cinzel text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fantasy-gold via-amber-200 to-amber-500 tracking-tight">
              Pilih Dunia Petualanganmu
            </h2>
            <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed">
              Setiap keputusan didukung kalkulasi dadu D20, narasi adaptif AI Dungeon Master, serta mini-VTT pertempuran taktis.
            </p>
          </div>

          {/* Campaign Cards */}
          {initLoading ? (
            <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-fantasy-gold" />
              <span>Memuat arsip kampanye...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="group relative bg-slate-950/80 border-2 border-fantasy-border/60 hover:border-fantasy-gold rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-fantasy-gold/20 transition-all duration-300 flex flex-col justify-between hover:scale-[1.02]"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-fantasy-border flex items-center justify-center text-2xl shadow-inner">
                      {camp.icon || '⚔️'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 block">
                      Genre: {camp.genre?.replace('_', ' ')}
                    </span>
                    <h3 className="font-cinzel text-lg md:text-xl font-bold text-white group-hover:text-fantasy-gold transition-colors">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {camp.premise}
                    </p>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleSelectCampaign(camp)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-fantasy-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-cinzel font-bold text-xs tracking-wider shadow-lg shadow-fantasy-gold/20 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      Pilih Kampanye
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500 font-mono">
          AetherMaster AI Local Edition • Three.js 3D D20 • Web Audio Synth • SQLite Persistence
        </footer>

        {/* Character Creation Modal */}
        <CharacterCreationModal
          isOpen={isCharCreationOpen}
          campaign={selectedCampaign}
          onClose={() => setIsCharCreationOpen(false)}
          onConfirm={handleStartGame}
          isLoading={isLoading}
        />

        {/* Save Load Modal */}
        <SaveLoadModal
          isOpen={isSaveLoadOpen}
          onClose={() => setIsSaveLoadOpen(false)}
          sessionId={null}
          onLoadSession={handleLoadSession}
        />
      </div>
    );
  }

  // In-Game Active Stage View
  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 flex overflow-hidden selection:bg-fantasy-gold selection:text-slate-950">
      <ToastNotification />
      <VisualNovelStage
        node={currentNode}
        character={character}
        onChooseAction={handleChooseAction}
        onOpenStoryTree={() => setIsStoryTreeOpen(true)}
        onOpenBacklog={() => setIsBacklogOpen(true)}
        onOpenSaveLoad={() => setIsSaveLoadOpen(true)}
        isLoading={isLoading}
        hudComponent={
          <CharacterHUD
            character={character}
            onUseItem={handleUseItem}
          />
        }
      />

      {/* Story Tree & Rewind Modal */}
      <StoryTreeModal
        isOpen={isStoryTreeOpen}
        onClose={() => setIsStoryTreeOpen(false)}
        sessionId={session?.id}
        currentNodeId={currentNode?.id}
        onRewind={handleRewind}
      />

      {/* Backlog Transcript Modal */}
      <BacklogModal
        isOpen={isBacklogOpen}
        onClose={() => setIsBacklogOpen(false)}
        sessionId={session?.id}
      />

      {/* Multi-Slot Save/Load Modal */}
      <SaveLoadModal
        isOpen={isSaveLoadOpen}
        onClose={() => setIsSaveLoadOpen(false)}
        sessionId={session?.id}
        onLoadSession={handleLoadSession}
      />
    </div>
  );
}
