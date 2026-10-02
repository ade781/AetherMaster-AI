import React, { createContext, useContext, useState, useCallback } from 'react';
import { campaignApi } from '../services/api';
import { PRESET_THEMES, DIFFICULTY_PRESETS } from '../services/campaignMockApi';
import audio from '../services/audioService';

const CampaignContext = createContext(null);

export function CampaignProvider({ children }) {
  const [step, setStep] = useState(1); // 1: Tema, 2: Tingkat Bahaya, 3: Panduan AI, 4: Live Preview
  const [selectedTheme, setSelectedTheme] = useState('gothic-dungeon');
  const [selectedDifficulty, setSelectedDifficulty] = useState('balanced');
  const [storyLength, setStoryLength] = useState(7); // 3, 7, 15
  const [narrativePrompt, setNarrativePrompt] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const [generatedCampaign, setGeneratedCampaign] = useState(null);
  const [dynamicNpcs, setDynamicNpcs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Generate complete campaign
  const handleGenerateCampaign = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    audio.playMagic();

    try {
      const payload = {
        themeId: selectedTheme,
        difficultyId: selectedDifficulty,
        storyLength,
        narrativePrompt: narrativePrompt?.trim() || undefined,
        forceOffline: isOfflineMode
      };

      const result = await campaignApi.generateCampaign(payload);
      if (result && result.success && result.data) {
        setGeneratedCampaign(result.data);
        setDynamicNpcs(result.data.npcs || []);
        setStep(4); // Move to Preview
        audio.playSuccess();
      } else {
        throw new Error(result?.error?.message || 'Gagal menghasilkan petualangan.');
      }
    } catch (err) {
      console.error('Error generating campaign:', err);
      setError(err.message || 'Terjadi gangguan saat membangkitkan campaign.');
      audio.playFailure();
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTheme, selectedDifficulty, storyLength, narrativePrompt, isOfflineMode]);

  // Reroll single NPC without resetting whole campaign
  const handleRerollNpc = useCallback(async (npcId) => {
    const targetNpc = dynamicNpcs.find(n => n.id === npcId);
    if (!targetNpc) return;

    audio.playClick();
    try {
      const res = await campaignApi.generateDynamicNpc({ role: targetNpc.role });
      if (res && res.id) {
        const replacement = res;
        setDynamicNpcs(prev => prev.map(n => (n.id === npcId ? replacement : n)));
        setGeneratedCampaign(prev => {
          if (!prev) return null;
          return {
            ...prev,
            npcs: (prev.npcs || []).map(n => (n.id === npcId ? replacement : n))
          };
        });
        audio.playMagic();
      }
    } catch (err) {
      console.warn('Gagal me-reroll NPC:', err);
    }
  }, [dynamicNpcs]);

  // Update specific NPC profile
  const handleUpdateNpc = useCallback((npcId, updatedFields) => {
    setDynamicNpcs(prev => prev.map(n => (n.id === npcId ? { ...n, ...updatedFields } : n)));
    setGeneratedCampaign(prev => {
      if (!prev) return null;
      return {
        ...prev,
        npcs: (prev.npcs || []).map(n => (n.id === npcId ? { ...n, ...updatedFields } : n))
      };
    });
  }, []);

  // Reset wizard to initial step
  const handleResetBuilder = useCallback(() => {
    setStep(1);
    setSelectedTheme('gothic-dungeon');
    setSelectedDifficulty('balanced');
    setStoryLength(7);
    setNarrativePrompt('');
    setGeneratedCampaign(null);
    setDynamicNpcs([]);
    setError(null);
  }, []);

  const value = {
    step,
    setStep,
    selectedTheme,
    setSelectedTheme,
    selectedDifficulty,
    setSelectedDifficulty,
    storyLength,
    setStoryLength,
    narrativePrompt,
    setNarrativePrompt,
    isOfflineMode,
    setIsOfflineMode,
    generatedCampaign,
    setGeneratedCampaign,
    dynamicNpcs,
    isGenerating,
    error,
    generateCampaign: handleGenerateCampaign,
    rerollNpc: handleRerollNpc,
    updateNpc: handleUpdateNpc,
    resetBuilder: handleResetBuilder,
    themes: PRESET_THEMES,
    difficulties: DIFFICULTY_PRESETS
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaignStore() {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error('useCampaignStore must be used within a CampaignProvider');
  }
  return ctx;
}

export default CampaignContext;
