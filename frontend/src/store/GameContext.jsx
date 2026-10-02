import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import audio from '../services/audioService';
import storyApi, { API_BASE } from '../services/api';
import { formatErrorMessage } from '../utils/errorHandler';

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

  // Persistence & Save Status Lifecycle ('idle' | 'saving' | 'saved' | 'error')
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [autosaveRecoveryAvailable, setAutosaveRecoveryAvailable] = useState(null);

  // Orchestrator refs to guarantee race-condition free and debounce-safe autosaving
  const autosaveTimerRef = useRef(null);
  const autosaveAbortControllerRef = useRef(null);
  const isAutosavingRef = useRef(false);
  const queuedAutosaveRef = useRef(false);
  const sessionRef = useRef(session);
  const isMountedRef = useRef(true);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      if (autosaveAbortControllerRef.current) {
        autosaveAbortControllerRef.current.abort();
        autosaveAbortControllerRef.current = null;
      }
    };
  }, []);

  const showToast = useCallback((rawMessage, type = 'error') => {
    const fallback = type === 'error' ? 'Terjadi kesalahan pada sistem.' : 'Operasi berhasil.';
    const message = formatErrorMessage(rawMessage, fallback);
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /**
   * Internal executor for Slot 0 Autosave.
   * Protects against concurrent saves and processes queued updates sequentially.
   * Guarded with AbortController for deterministic cancellation upon unmount or scene exit.
   */
  const performAutosave = useCallback(async () => {
    const activeSessionId = sessionRef.current?.id;
    if (!activeSessionId) return;

    if (isAutosavingRef.current) {
      queuedAutosaveRef.current = true;
      return;
    }

    if (autosaveAbortControllerRef.current) {
      autosaveAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    autosaveAbortControllerRef.current = abortController;

    isAutosavingRef.current = true;
    if (isMountedRef.current) {
      setSaveStatus('saving');
    }

    try {
      const data = await storyApi.autoSave(activeSessionId);
      if (abortController.signal.aborted || !isMountedRef.current) {
        return;
      }

      if (data && data.success) {
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        setTimeout(() => {
          if (isMountedRef.current && !abortController.signal.aborted) {
            setSaveStatus(prev => (prev === 'saved' ? 'idle' : prev));
          }
        }, 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Autosave error (non-blocking):', err);
      if (isMountedRef.current && !abortController.signal.aborted) {
        setSaveStatus('error');
      }
    } finally {
      isAutosavingRef.current = false;
      if (isMountedRef.current && queuedAutosaveRef.current && !abortController.signal.aborted) {
        queuedAutosaveRef.current = false;
        performAutosave();
      }
    }
  }, []);

  /**
   * Debounced autosave scheduler.
   * Collapses rapid mutations into a single persistent save (1000ms delay).
   */
  const scheduleAutosave = useCallback((targetSessionId) => {
    const idToSave = targetSessionId || sessionRef.current?.id;
    if (!idToSave) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      performAutosave();
    }, 1000);
  }, [performAutosave]);

  // Fetch campaigns and check active session or autosave recovery on mount
  useEffect(() => {
    storyApi.getCampaigns()
      .then(data => {
        if (data.success) {
          setCampaigns(data.data || []);
        }
      })
      .catch(err => console.error('Gagal mengambil kampanye:', err))
      .finally(() => setInitLoading(false));

    const checkAutosaveFallback = () => {
      storyApi.getSaveSlots()
        .then(slotsRes => {
          if (slotsRes.success && slotsRes.data?.[0]) {
            setAutosaveRecoveryAvailable(slotsRes.data[0]);
          }
        })
        .catch(err => console.warn('Gagal memeriksa slot autosave:', err));
    };

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
            checkAutosaveFallback();
          }
        })
        .catch(err => {
          console.warn('Gagal memulihkan sesi aktif:', err);
          localStorage.removeItem('aethermaster_active_session_id');
          checkAutosaveFallback();
        });
    } else {
      checkAutosaveFallback();
    }
  }, []);

  // Exit active session and return to Landing Page
  const handleExitSession = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    if (autosaveAbortControllerRef.current) {
      autosaveAbortControllerRef.current.abort();
      autosaveAbortControllerRef.current = null;
    }
    localStorage.removeItem('aethermaster_active_session_id');
    setSession(null);
    setCharacter(null);
    setCurrentNode(null);
    setCombatState(null);
    setSelectedCampaign(null);
    setSaveStatus('idle');
  }, []);

  // Start campaign selection
  const handleSelectCampaign = useCallback((camp) => {
    audio.playSelect();
    setSelectedCampaign(camp);
    setIsCharCreationOpen(true);
  }, []);

  // Start new game with initial autosave
  const handleStartGame = useCallback(async (characterData) => {
    if (!selectedCampaign) return;
    setIsLoading(true);
    try {
      const data = await storyApi.startAdventure(selectedCampaign.id, characterData);
      if (data.success) {
        const newSessionId = data.data.session?.id;
        if (newSessionId) {
          localStorage.setItem('aethermaster_active_session_id', newSessionId);
        }
        setSession(data.data.session);
        setCharacter(data.data.character);
        setCurrentNode(data.data.currentNode);
        setCombatState(data.data.session?.combatState || null);
        setIsCharCreationOpen(false);
        setAutosaveRecoveryAvailable(null);

        // Schedule initial autosave for fresh adventure
        scheduleAutosave(newSessionId);
      } else {
        showToast(data.error || 'Gagal memulai petualangan.', 'error');
      }
    } catch (err) {
      showToast('Koneksi ke backend gagal.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCampaign, showToast, scheduleAutosave]);

  // Execute narrative action and trigger autosave
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

        // Schedule autosave after confirmed state mutation
        scheduleAutosave(data.data.session?.id || session.id);
      } else {
        showToast(data.error || 'Gagal mengambil tindakan.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan komunikasi dengan server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [session, isLoading, showToast, scheduleAutosave]);

  // Server-Side Tactical Combat Action Dispatcher with autosave
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

        // Schedule autosave after combat turn resolution
        scheduleAutosave(data.data.session?.id || session.id);
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
  }, [session, isLoading, showToast, scheduleAutosave]);

  // Use item from inventory with autosave
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
        // Schedule autosave after item consumption
        scheduleAutosave(session.id);
      } else {
        showToast(data.error || 'Gagal menggunakan item.', 'error');
      }
    } catch (err) {
      showToast('Koneksi ke backend gagal saat menggunakan item.', 'error');
    }
  }, [character, session, showToast, scheduleAutosave]);

  // Rewind to specific node with autosave
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
        // Schedule autosave after rewind
        scheduleAutosave(data.data.session?.id || session.id);
      } else {
        showToast(data.error || 'Gagal memulihkan ke node target.', 'error');
      }
    } catch (err) {
      showToast('Koneksi ke backend gagal saat rewind.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [session, showToast, scheduleAutosave]);

  // Load session from slot
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
    setAutosaveRecoveryAvailable(null);
  }, []);

  // Recover session from Autosave Slot 0
  const handleRecoverFromAutosave = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await storyApi.loadFromSlot(0);
      if (res.success && res.data) {
        handleLoadSession(res.data);
        showToast('Petualangan berhasil dipulihkan dari Autosave!', 'success');
      } else {
        showToast(res.error || 'Gagal memulihkan autosave.', 'error');
      }
    } catch (err) {
      showToast('Koneksi server terganggu saat memulihkan autosave.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [handleLoadSession, showToast]);

  const handleDismissAutosaveRecovery = useCallback(() => {
    setAutosaveRecoveryAvailable(null);
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
    saveStatus,
    lastSavedAt,
    scheduleAutosave,
    autosaveRecoveryAvailable,
    handleRecoverFromAutosave,
    handleDismissAutosaveRecovery,
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
