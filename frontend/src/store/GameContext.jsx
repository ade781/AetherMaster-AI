import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import audio from '../services/audioService';

const GameContext = createContext(null);

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000/api/story';

export function GameProvider({ children }) {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [session, setSession] = useState(null);
  const [character, setCharacter] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [combatState, setCombatState] = useState(null);

  // Modals & UI states
  const [isCharCreationOpen, setIsCharCreationOpen] = useState(false);
  const [isStoryTreeOpen, setIsStoryTreeOpen] = useState(false);
  const [isBacklogOpen, setIsBacklogOpen] = useState(false);
  const [isSaveLoadOpen, setIsSaveLoadOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

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

  // Start campaign selection
  const handleSelectCampaign = useCallback((camp) => {
    audio.playSelect();
    setSelectedCampaign(camp);
    setIsCharCreationOpen(true);
  }, []);

  // Start new game
  const handleStartGame = useCallback(async (characterData) => {
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
        setCombatState(data.data.session?.combatState || null);
        setIsCharCreationOpen(false);
      } else {
        showToast(data.error || 'Gagal memulai petualangan.', 'error');
      }
    } catch (err) {
      showToast('Koneksi ke backend gagal.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCampaign, showToast]);

  // Execute narrative action
  const handleChooseAction = useCallback(async (choice) => {
    if (!session || isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          choiceId: choice.id,
          customText: choice.customText,
          tone: choice.tone
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
        setCombatState(null);
      } else {
        showToast(data.error || 'Gagal mengambil tindakan.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan komunikasi dengan server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [session, isLoading, showToast]);

  // Use item from inventory
  const handleUseItem = useCallback(async (item) => {
    if (!character || !session) return;
    
    if (item.category !== 'Obat' && item.category !== 'Potion' && !item.id.includes('potion')) {
      showToast(`${item.name} tidak bisa dikonsumsi langsung. Gunakan melalui dialog/pilihan!`, 'error');
      audio.playClick();
      return;
    }

    audio.playSelect();
    try {
      const res = await fetch(`${API_BASE}/use-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          itemId: item.id
        })
      });

      const data = await res.json();
      if (data.success && data.data?.character) {
        setCharacter(data.data.character);
        audio.playHeal();
        showToast(data.message || `Memulihkan status dengan ${item.name}!`, 'success');
      } else {
        showToast(data.error || 'Gagal menggunakan item.', 'error');
      }
    } catch (err) {
      showToast('Koneksi ke backend gagal saat menggunakan item.', 'error');
    }
  }, [character, session, showToast]);

  // Rewind to specific node
  const handleRewind = useCallback(async (targetNodeId) => {
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
        setCombatState(data.data.session?.combatState || null);
        setIsStoryTreeOpen(false);
      }
    } catch (err) {
      console.error('Rewind error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Load session
  const handleLoadSession = useCallback((loadedData) => {
    setSession(loadedData.session);
    setCharacter(loadedData.character);
    setCurrentNode(loadedData.currentNode);
    setCombatState(loadedData.session?.combatState || null);
    setIsSaveLoadOpen(false);
  }, []);

  // Resolve tactical combat outcome
  const handleResolveCombat = useCallback((result) => {
    if (result?.playerHp !== undefined && character) {
      setCharacter(prev => prev ? ({ ...prev, hp: result.playerHp }) : prev);
    }
    handleChooseAction({
      id: 'combat_victory',
      text: `Menumbangkan musuh dalam pertempuran taktis! (Sisa HP: ${result?.playerHp ?? character?.hp})`,
      tone: 'heroik'
    });
  }, [character, handleChooseAction]);

  // Global Keyboard Shortcuts (I, L, M)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setIsInventoryOpen(prev => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        if (session) {
          e.preventDefault();
          setIsBacklogOpen(prev => !prev);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (session) {
          e.preventDefault();
          setIsStoryTreeOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session]);

  // Reactive Heartbeat audio synth when HP < 20%
  useEffect(() => {
    if (!character || character.hp <= 0) {
      audio.stopHeartbeat?.();
      return;
    }
    const hpPercent = (character.hp / (character.maxHp || 1)) * 100;
    if (hpPercent <= 20) {
      audio.startHeartbeat?.();
    } else {
      audio.stopHeartbeat?.();
    }
    return () => {
      audio.stopHeartbeat?.();
    };
  }, [character?.hp, character?.maxHp]);

  const value = {
    campaigns,
    selectedCampaign,
    session,
    setSession,
    character,
    setCharacter,
    currentNode,
    setCurrentNode,
    combatState,
    setCombatState,
    isCharCreationOpen,
    setIsCharCreationOpen,
    isStoryTreeOpen,
    setIsStoryTreeOpen,
    isBacklogOpen,
    setIsBacklogOpen,
    isSaveLoadOpen,
    setIsSaveLoadOpen,
    isInventoryOpen,
    setIsInventoryOpen,
    isLoading,
    initLoading,
    toast,
    showToast,
    handleSelectCampaign,
    handleStartGame,
    handleChooseAction,
    handleResolveCombat,
    handleUseItem,
    handleRewind,
    handleLoadSession
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameStore() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGameStore must be used within a GameProvider');
  }
  return ctx;
}

export default GameContext;
