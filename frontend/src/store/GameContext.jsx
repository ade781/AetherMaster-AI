import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import audio from '../services/audioService';
import storyApi, { API_BASE } from '../services/api';

const GameContext = createContext(null);

export { API_BASE };

export function GameProvider({ children }) {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [session, setSession] = useState(null);
  const [character, setCharacter] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [combatState, setCombatState] = useState(null);

  // Active Modals & UI states
  const [isCharCreationOpen, setIsCharCreationOpen] = useState(false);
  const [isStoryTreeOpen, setIsStoryTreeOpen] = useState(false);
  const [isSaveLoadOpen, setIsSaveLoadOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch campaigns and restore session if available on mount
  useEffect(() => {
    storyApi.getCampaigns()
      .then(data => {
        if (data.success) {
          setCampaigns(data.data || []);
        }
      })
      .catch(err => console.error('Gagal mengambil kampanye:', err))
      .finally(() => setInitLoading(false));

    const savedSessionId = localStorage.getItem('aethermaster_active_session_id');
    if (savedSessionId) {
      storyApi.getSession(savedSessionId)
        .then(data => {
          if (data.success && data.data) {
            setSession(data.data.session);
            setCharacter(data.data.character);
            setCurrentNode(data.data.currentNode);
            setCombatState(data.data.combatState || data.data.session?.combatState || null);
            if (data.data.campaign) {
              setSelectedCampaign(data.data.campaign);
            }
          } else {
            localStorage.removeItem('aethermaster_active_session_id');
          }
        })
        .catch(err => {
          console.warn('Gagal memulihkan sesi aktif:', err);
        });
    }
  }, []);

  // Exit active session and return to Landing Page
  const handleExitSession = useCallback(() => {
    localStorage.removeItem('aethermaster_active_session_id');
    setSession(null);
    setCharacter(null);
    setCurrentNode(null);
    setCombatState(null);
    setSelectedCampaign(null);
  }, []);

  // Start campaign selection
  const handleSelectCampaign = useCallback((camp) => {
    audio.playSelect();
    setSelectedCampaign(camp);
    setIsCharCreationOpen(true);
  }, []);

  // Start new game
  const handleStartGame = useCallback(async (characterData) => {
    if (!selectedCampaign) return;
    setIsLoading(true);
    try {
      const data = await storyApi.startAdventure(selectedCampaign.id, characterData);
      if (data.success) {
        if (data.data.session?.id) {
          localStorage.setItem('aethermaster_active_session_id', data.data.session.id);
        }
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
      const data = await storyApi.chooseAction(session.id, {
        choiceId: choice.id,
        customText: choice.customText,
        tone: choice.tone
      });

      if (data.success) {
        setSession(data.data.session);
        setCharacter(data.data.character);
        setCurrentNode(data.data.currentNode);
        setCombatState(data.data.session?.combatState || null);
      } else {
        showToast(data.error || 'Gagal mengambil tindakan.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan komunikasi dengan server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [session, isLoading, showToast]);

  // Server-Side Tactical Combat Action Dispatcher
  const handleCombatAction = useCallback(async (action, itemId = null) => {
    if (!session || isLoading) return null;
    setIsLoading(true);

    try {
      const data = await storyApi.combatAction(session.id, action, itemId);
      if (data.success && data.data) {
        setSession(data.data.session);
        setCharacter(data.data.character);
        setCombatState(data.data.combatState);

        if (data.data.isVictory) {
          showToast('Kemenangan! Pertempuran berakhir gemilang.', 'success');
        } else if (data.data.isGameOver) {
          showToast('Karaktermu tumbang dalam pertempuran!', 'error');
        } else if (data.data.isFled) {
          showToast('Berhasil meloloskan diri!', 'success');
        }

        return data.data;
      } else {
        showToast(data.error || 'Aksi pertarungan ditolak oleh server.', 'error');
        return null;
      }
    } catch (err) {
      showToast('Koneksi ke backend gagal saat mengeksekusi aksi tempur.', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session, isLoading, showToast]);

  // Use item from inventory
  const handleUseItem = useCallback(async (item) => {
    if (!character || !session) return;

    if (item.category !== 'Obat' && item.category !== 'Potion' && item.category !== 'consumable' && !item.id.includes('potion')) {
      showToast(`${item.name} tidak bisa dikonsumsi langsung. Gunakan melalui dialog/pilihan!`, 'error');
      audio.playClick();
      return;
    }

    audio.playSelect();
    try {
      const data = await storyApi.useItem(session.id, item.id);
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
      const data = await storyApi.rewindStory(session.id, targetNodeId);
      if (data.success) {
        setSession(data.data.session);
        setCharacter(data.data.character);
        setCurrentNode(data.data.currentNode);
        setCombatState(data.data.session?.combatState || null);
        setIsStoryTreeOpen(false);
      } else {
        showToast(data.error || 'Gagal memulihkan ke node target.', 'error');
      }
    } catch (err) {
      showToast('Koneksi ke backend gagal saat rewind.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [session, showToast]);

  // Load session
  const handleLoadSession = useCallback((loadedData) => {
    if (loadedData.session?.id) {
      localStorage.setItem('aethermaster_active_session_id', loadedData.session.id);
    }
    setSession(loadedData.session);
    setCharacter(loadedData.character);
    setCurrentNode(loadedData.currentNode);
    setCombatState(loadedData.session?.combatState || null);
    if (loadedData.campaign) {
      setSelectedCampaign(loadedData.campaign);
    }
    setIsSaveLoadOpen(false);
  }, []);

  // Narrative transition after confirmed combat victory
  const handleResolveCombat = useCallback(() => {
    handleChooseAction({
      id: 'combat_victory',
      text: 'Menumbangkan musuh dalam pertempuran taktis dan mengamankan kemenangan!',
      tone: 'heroik'
    });
  }, [handleChooseAction]);

  // Narrative transition after fleeing
  const handleFleeCombat = useCallback(() => {
    handleChooseAction({
      id: 'combat_fled',
      text: 'Meloloskan diri dari pertempuran sengit untuk mencari jalan lain.',
      tone: 'waspada'
    });
  }, [handleChooseAction]);

  // Reactive Heartbeat audio synth when HP <= 20%
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
    handleCombatAction,
    handleResolveCombat,
    handleFleeCombat,
    handleUseItem,
    handleRewind,
    handleLoadSession,
    handleExitSession
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
