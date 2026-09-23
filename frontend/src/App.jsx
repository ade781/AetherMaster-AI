import React, { useState, useEffect } from 'react';
import CharacterHUD from './components/CharacterHUD';
import VisualNovelStage from './components/VisualNovelStage';
import CharacterCreationModal from './components/CharacterCreationModal';
import StoryTreeModal from './components/StoryTreeModal';
import BacklogModal from './components/BacklogModal';
import SaveLoadModal from './components/SaveLoadModal';
import LandingPage from './components/LandingPage';
import audio from './services/audioService';
import { Shield, Sparkles, BookOpen, Skull, Play, RefreshCw, Compass } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5000/api/story';

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

  // Home Screen: Epic Landing Page
  if (!session || !currentNode) {
    return (
      <>
        <ToastNotification />
        <LandingPage
          campaigns={campaigns}
          initLoading={initLoading}
          onSelectCampaign={handleSelectCampaign}
          onOpenSaveLoad={() => setIsSaveLoadOpen(true)}
          showToast={showToast}
        />

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
      </>
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
