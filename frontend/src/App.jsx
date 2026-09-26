import React from 'react';
import { GameProvider, useGameStore } from './store/GameContext';
import CharacterHUD from './components/CharacterHUD';
import VisualNovelStage from './components/VisualNovelStage';
import CharacterCreationModal from './components/CharacterCreationModal';
import StoryTreeModal from './components/StoryTreeModal';
import SaveLoadModal from './components/SaveLoadModal';
import GameOverModal from './components/GameOverModal';
import LandingPage from './components/LandingPage';


function MainGame() {
  const {
    campaigns,
    selectedCampaign,
    session,
    setSession,
    character,
    setCharacter,
    currentNode,
    setCurrentNode,
    combatState,
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
  } = useGameStore();

  // Toast Notification
  const ToastNotification = () => {
    if (!toast) return null;
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slideDown">
        <div className={`px-4 py-2.5 rounded-xl shadow-2xl border flex items-center gap-2 ${toast.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
          }`}>
          <span className="text-xs md:text-sm font-medium">{toast.message}</span>
        </div>
      </div>
    );
  };

  // Home Screen: Modular Landing Page
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

  // Active Adventure Stage View
  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 flex overflow-hidden selection:bg-amber-400 selection:text-slate-950">
      <ToastNotification />

      {/* Main Visual Novel Narrative Stage */}
      <VisualNovelStage
        node={currentNode}
        character={character}
        campaign={selectedCampaign || session?.Campaign}
        session={session}
        onChooseAction={handleChooseAction}
        onOpenStoryTree={() => setIsStoryTreeOpen(true)}
        onOpenSaveLoad={() => setIsSaveLoadOpen(true)}
        onToggleInventory={() => setIsInventoryOpen(prev => !prev)}
        isLoading={isLoading}
        hudComponent={
          <CharacterHUD
            character={character}
            onUseItem={handleUseItem}
            isInventoryOpen={isInventoryOpen}
            onToggleInventory={setIsInventoryOpen}
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

      {/* Multi-Slot Save/Load Modal */}
      <SaveLoadModal
        isOpen={isSaveLoadOpen}
        onClose={() => setIsSaveLoadOpen(false)}
        sessionId={session?.id}
        onLoadSession={handleLoadSession}
      />

      {/* Game Over & Defeat Modal */}
      <GameOverModal
        isOpen={Boolean(character && (character.hp <= 0 || session?.isGameOver))}
        character={character}
        session={session}
        onRewind={() => setIsStoryTreeOpen(true)}
        onLoadGame={() => setIsSaveLoadOpen(true)}
        onRestart={() => {
          setSession(null);
          setCharacter(null);
          setCurrentNode(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <MainGame />
    </GameProvider>
  );
}
