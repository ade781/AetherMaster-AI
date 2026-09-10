import React, { useState, useEffect } from 'react';
import { VisualNovelStage } from './components/VisualNovelStage';
import { SaveLoadModal } from './components/SaveLoadModal';
import { audio } from './services/audioService';
import { Sparkles, Sword, Play, AlertCircle, RefreshCw, Database } from 'lucide-react';

const STORAGE_KEY = 'aethermaster_vn_save_v1';
const API_BASE = 'http://localhost:5000/api';

export function App() {
  const [currentScene, setCurrentScene] = useState(null);
  const [history, setHistory] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  // Restore local cache if present
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.currentScene) {
          setCurrentScene(parsed.currentScene);
          setHistory(parsed.history || []);
          setSessionId(parsed.sessionId || null);
          setIsGameStarted(true);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved game data', e);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (currentScene && isGameStarted) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ 
            currentScene, 
            history, 
            sessionId,
            updatedAt: new Date().toISOString() 
          })
        );
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }
    }
  }, [currentScene, history, sessionId, isGameStarted]);

  // Start new game
  const handleStartGame = async () => {
    setIsLoading(true);
    setError(null);
    audio.playSceneTransition();

    const newId = `session_${Date.now()}`;

    try {
      const res = await fetch(`${API_BASE}/story/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: newId }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data.scene) {
        setCurrentScene(data.scene);
        setHistory([]);
        setSessionId(data.sessionId || newId);
        setIsGameStarted(true);
        audio.startAmbient();
      } else {
        throw new Error('Format respon adegan tidak valid.');
      }
    } catch (err) {
      console.error('Failed to start story:', err);
      setError('Gagal menghubungi AI Dungeon Master. Pastikan server backend aktif di port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  // Player selected an action choice
  const handleSelectChoice = async (choice) => {
    if (isLoading || !choice) return;

    setIsLoading(true);
    setError(null);

    const previousSnapshot = {
      ...currentScene,
      chosenAction: choice.text,
    };
    const updatedHistory = [...history, previousSnapshot];
    setHistory(updatedHistory);

    try {
      const res = await fetch(`${API_BASE}/story/choice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          choiceText: choice.text,
          previousScene: currentScene,
          history: updatedHistory,
        }),
      });

      if (!res.ok) {
        throw new Error(`Gagal memproses aksi: ${res.status}`);
      }

      const data = await res.json();
      if (data.scene) {
        setCurrentScene(data.scene);
        audio.playSceneTransition();
      } else {
        throw new Error('Respon adegan selanjutnya tidak valid.');
      }
    } catch (err) {
      console.error('Choice processing error:', err);
      setError('Gagal melanjutkan adegan. Silakan coba klik tombol Ulangi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load session from Sequelize database
  const handleLoadSession = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/story/sessions/${id}`);
      const data = await res.json();
      if (data.success && data.session) {
        setCurrentScene(data.session.currentScene);
        setHistory(data.session.history || []);
        setSessionId(data.session.id);
        setIsGameStarted(true);
        audio.playSceneTransition();
        audio.startAmbient();
      } else {
        throw new Error('Sesi tidak ditemukan.');
      }
    } catch (err) {
      setError('Gagal memuat sesi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Restart story
  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    handleStartGame();
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between">
      {/* Error Banner */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4">
          <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-600/60 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => {
                setError(null);
                if (!isGameStarted) handleStartGame();
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-medium flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Screen Router */}
      {!isGameStarted ? (
        <main className="min-h-screen flex items-center justify-center p-6 select-none relative overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="glass-panel max-w-xl w-full p-8 md:p-12 rounded-3xl text-center space-y-6 relative border border-amber-500/30">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/40 bg-amber-950/60 text-amber-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Dungeon Master • Gemini 3.6 & Sequelize</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 drop-shadow-sm">
                AetherMaster AI
              </h1>
              <p className="text-amber-500/90 font-serif text-sm tracking-widest uppercase">
                The Whispering Tavern & The Cursed Woods
              </p>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed pt-2 font-sans">
                Masuki kedai pengembara tua di malam badai. Setiap keputusan taktis dan moralmu akan membentuk takdir dan mengungkap misteri relik kuno di Hutan Terkutuk.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                disabled={isLoading}
                onClick={handleStartGame}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-base shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2.5 active:scale-95 transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Mempersiapkan Takdir...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Mulai Petualangan Baru</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  audio.playClick();
                  setIsDatabaseModalOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-xl border border-slate-700 bg-slate-900/80 hover:border-amber-500/50 hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Database className="w-4 h-4 text-amber-500" />
                <span>Pilih Sesi Simpanan</span>
              </button>
            </div>

            <div className="pt-4 text-xs text-slate-500 border-t border-slate-800 flex items-center justify-center gap-2">
              <Sword className="w-3.5 h-3.5 text-amber-600" />
              <span>Visual Novel RPG Interaktif • Database SQLite Sequelize • Audio Native</span>
            </div>
          </div>
        </main>
      ) : (
        <VisualNovelStage
          currentScene={currentScene}
          onSelectChoice={handleSelectChoice}
          isLoading={isLoading}
          history={history}
          sessionId={sessionId}
          onRestart={handleRestart}
          onLoadSession={handleLoadSession}
        />
      )}

      {/* Database Sessions Modal on Title Screen */}
      <SaveLoadModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onLoadSession={handleLoadSession}
        activeSessionId={sessionId}
      />
    </div>
  );
}

export default App;
