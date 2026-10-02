import React, { useState, useEffect, useCallback, useMemo } from 'react';
import audio from '../services/audioService';
import SceneBackground from './visual-novel/SceneBackground';
import SceneHeader from './visual-novel/SceneHeader';
import SceneMissionCodex from './visual-novel/SceneMissionCodex';
import ScenePortrait from './visual-novel/ScenePortrait';
import SceneDialogueBox from './visual-novel/SceneDialogueBox';
import SceneActionDeck from './visual-novel/SceneActionDeck';
import { resolveSceneAmbient } from './visual-novel/constants';

export default function VisualNovelStage({
  node,
  character,
  campaign,
  session,
  onChooseAction,
  onOpenStoryTree,
  onOpenSaveLoad,
  onToggleInventory,
  onExitSession,
  isLoading,
  hudComponent
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(false);

  const fullText = node?.dialogueText || 'Kisahmu dimulai di alam semesta AetherMaster...';

  // Mission Log parsing
  const missionLog = useMemo(() => {
    let parsed = session?.missionLog;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = null;
      }
    }
    return {
      title: parsed?.title || campaign?.title || 'Jurnal Misi Petualang',
      prologue: parsed?.prologue || campaign?.description || 'Informasi latar belakang misi sedang disinkronkan oleh Dungeon Master. Selesaikan penyelidikan di lokasi saat ini.',
      objective: parsed?.objective || 'Tuntaskan investigasi dan netralkan sumber krisis.'
    };
  }, [session?.missionLog, campaign?.title, campaign?.description]);

  // Choices parsing
  const choices = useMemo(() => {
    const raw = node?.choices;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (raw && typeof raw === 'object') {
      return Object.values(raw);
    }
    return [];
  }, [node?.choices]);

  // Skip typewriter handler
  const handleSkipTypewriter = useCallback(() => {
    if (isTyping) {
      setDisplayedText(fullText);
      setIsTyping(false);
    }
  }, [isTyping, fullText]);

  // Automatic scene ambient soundscape sync
  useEffect(() => {
    if (!soundEnabled) return;
    const track = resolveSceneAmbient(node?.backgroundId);
    audio.startAmbient(track);
  }, [node?.backgroundId, soundEnabled]);

  // Typewriter effect & narration
  useEffect(() => {
    if (!fullText) return;
    setIsTyping(true);
    setDisplayedText('');

    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setDisplayedText(fullText.slice(0, currentIdx));
      if (currentIdx >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15);

    if (speechEnabled) {
      audio.speakNarration(fullText);
    }

    return () => {
      clearInterval(interval);
      audio.stopSpeech();
    };
  }, [node?.id, fullText, speechEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.setMuted(!next);
  };

  const toggleSpeech = () => {
    const next = !speechEnabled;
    setSpeechEnabled(next);
    if (!next) {
      audio.stopSpeech();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden bg-black select-none">
      {/* LEFT PANEL: Visual Stage (52%-60% on desktop) */}
      <div className="relative w-full md:w-[52%] lg:w-[56%] xl:w-[60%] h-[40vh] sm:h-[45vh] md:h-full overflow-hidden flex-shrink-0">
        <SceneBackground
          backgroundId={node?.backgroundId}
          campaign={campaign}
        />

        <SceneHeader
          chapterTitle={node?.chapterTitle}
          location={node?.location}
          soundEnabled={soundEnabled}
          speechEnabled={speechEnabled}
          onToggleSound={toggleSound}
          onToggleSpeech={toggleSpeech}
          onOpenStoryTree={onOpenStoryTree}
          onOpenSaveLoad={onOpenSaveLoad}
          onExitSession={onExitSession}
        />

        <SceneMissionCodex
          missionLog={missionLog}
          character={character}
          session={session}
          campaign={campaign}
        />

        <ScenePortrait
          characterId={node?.characterId}
          speaker={node?.speaker}
        />
      </div>

      {/* RIGHT PANEL: Story Dashboard (40%-48% on desktop) */}
      <div className="relative w-full md:w-[48%] lg:w-[44%] xl:w-[40%] flex-1 md:h-full flex flex-col bg-slate-950/95 border-t md:border-t-0 md:border-l border-white/10 shadow-2xl z-20 min-h-0 overflow-hidden">
        {/* Insert Top HUD */}
        {hudComponent}

        {/* Scrollable Story & Choice Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 flex flex-col gap-5 scrollbar-hide">
          <SceneDialogueBox
            speaker={node?.speaker}
            mood={node?.mood}
            displayedText={displayedText}
            isTyping={isTyping}
            consequenceNote={node?.consequenceNote}
            onSkipTypewriter={handleSkipTypewriter}
          />

          <div id="scene-action-deck" className="mt-auto">
            <SceneActionDeck
              choices={choices}
              character={character}
              isLoading={isLoading}
              onChooseAction={onChooseAction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
