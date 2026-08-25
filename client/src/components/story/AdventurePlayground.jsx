import React, { useState, useEffect, useRef } from 'react';
import { VisualNovelStage } from './VisualNovelStage';
import { audioEngine } from '../../services/audioEngine';
import { Shield, Sparkles, Send, Dices, ArrowLeft, Volume2, VolumeX, Mic, MicOff, Key, Coins, Heart, AlertCircle, Music } from 'lucide-react';

export const AdventurePlayground = ({ character, story, onExit, onUpdateCharacter }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'dm',
      text: `${story.introPrompt}\n\nLokasi: ${story.startingLocation}. Apa tindakanmu, ${character.name}?`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    }
  ]);
  const [inputAction, setInputAction] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [suggestedChoices, setSuggestedChoices] = useState(story.initialChoices.map(c => c.text));
  const [activeRollRequest, setActiveRollRequest] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('aether_gemini_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [currentSceneKey, setCurrentSceneKey] = useState(
    story.id.includes('frost') ? 'mountain' : story.id.includes('shadow') ? 'forest' : story.id.includes('boar') ? 'tavern' : 'dungeon'
  );
  const [mutationNotice, setMutationNotice] = useState(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  // Toggle Ambient Audio
  const toggleAmbientMusic = () => {
    if (isAmbientPlaying) {
      audioEngine.stopAmbient();
      setIsAmbientPlaying(false);
    } else {
      audioEngine.startAmbient('mystery');
      setIsAmbientPlaying(true);
    }
  };

  // Web Speech API: Text-to-Speech (TTS)
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#]/g, ''));
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API: Speech-to-Text (STT)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser Anda belum mendukung input suara Speech-to-Text.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputAction(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSendChoice = (choiceText) => {
    executeAction(choiceText);
  };

  const handleSubmitAction = (e) => {
    e.preventDefault();
    if (!inputAction.trim() || isAiTyping) return;
    executeAction(inputAction);
    setInputAction('');
  };

  // Process Action to Backend AI DM
  const executeAction = async (actionText, rollResult = null) => {
    // Sound FX
    if (actionText.toLowerCase().includes('serang') || actionText.toLowerCase().includes('pedang')) {
      audioEngine.playSwordClash();
    } else if (actionText.toLowerCase().includes('mantra') || actionText.toLowerCase().includes('sihir')) {
      audioEngine.playSpellCast();
    } else {
      audioEngine.playDiceRoll();
    }

    const userMsg = {
      id: Date.now(),
      sender: 'player',
      text: rollResult ? `🎲 Melempar dadu D20 (${rollResult.die}): ${rollResult.total} untuk ${activeRollRequest?.type || 'Skill Check'}` : actionText,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAiTyping(true);
    setActiveRollRequest(null);

    try {
      const res = await fetch('/api/adventure/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          story,
          history: messages.slice(-6).map(m => ({ role: m.sender === 'dm' ? 'model' : 'user', text: m.text })),
          lastAction: actionText,
          rollResult,
          apiKey,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const { aiResponse, character: updatedChar } = data.data;

        const dmMsg = {
          id: Date.now() + 1,
          sender: 'dm',
          text: aiResponse.narrative,
          timestamp: new Date().toLocaleTimeString('id-ID'),
        };

        setMessages(prev => [...prev, dmMsg]);
        setSuggestedChoices(aiResponse.suggestedChoices || []);

        if (aiResponse.requestedRoll && aiResponse.requestedRoll.required) {
          setActiveRollRequest(aiResponse.requestedRoll);
        }

        // Live Mutation Feedback Notification & SFX
        if (aiResponse.mutation) {
          const mut = aiResponse.mutation;
          if (mut.goldChange > 0) audioEngine.playCoinDrop();
          if (mut.hpChange < 0) audioEngine.playSwordClash();

          if (mut.hpChange !== 0 || mut.goldChange !== 0 || mut.itemGained) {
            setMutationNotice({
              hp: mut.hpChange,
              gold: mut.goldChange,
              item: mut.itemGained,
            });
            setTimeout(() => setMutationNotice(null), 4500);
          }
        }

        if (onUpdateCharacter && updatedChar) {
          onUpdateCharacter(updatedChar);
        }
      } else {
        const errorDmMsg = {
          id: Date.now() + 1,
          sender: 'dm',
          text: `⚠️ [Koneksi Dungeon Master]: ${data.message || 'Terjadi gangguan sesaat. Kamu tetap bisa melanjutkan petualanganmu!'}`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
        };
        setMessages(prev => [...prev, errorDmMsg]);
      }
    } catch (err) {
      console.error('Adventure action error:', err);
      const offlineDmMsg = {
        id: Date.now() + 1,
        sender: 'dm',
        text: '⚠️ [Dungeon Master]: Koneksi jaringan internet terputus sesaat. Simulator cadangan offline telah mengamankan petualanganmu.',
        timestamp: new Date().toLocaleTimeString('id-ID'),
      };
      setMessages(prev => [...prev, offlineDmMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleResolveRoll = (dieResult) => {
    audioEngine.playDiceRoll();
    executeAction(`Hasil lemparan D20: ${dieResult.total}`, {
      ...dieResult,
      dc: activeRollRequest?.dc || 12,
      checkType: activeRollRequest?.type || 'Skill Check',
    });
  };

  const handleSaveApiKey = (key) => {
    localStorage.setItem('aether_gemini_key', key);
    setApiKey(key);
    setShowKeyModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Visual Novel Scenery Stage with Weather Particles */}
      <VisualNovelStage
        story={story}
        currentScene={currentSceneKey}
        character={character}
      />

      {/* Top Session Bar */}
      <div className="flex flex-wrap justify-between items-center bg-slate-900/90 border border-fantasy-border p-3.5 rounded-2xl gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              audioEngine.stopAmbient();
              onExit();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs font-bold font-cinzel flex items-center gap-1.5"
          >
            <ArrowLeft size={16} /> Keluar Sesi
          </button>
          <div>
            <h3 className="font-cinzel text-fantasy-gold font-bold text-sm sm:text-base">{story.title}</h3>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              📍 {story.startingLocation}
            </span>
          </div>
        </div>

        {/* Ambient audio toggle & Vitals */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleAmbientMusic}
            className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              isAmbientPlaying
                ? 'bg-purple-950/80 text-purple-300 border-purple-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Audio Musik Ambient Web Audio API"
          >
            <Music size={13} /> {isAmbientPlaying ? 'Musik Aktif 🎵' : 'Musik Mati'}
          </button>

          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
              apiKey ? 'bg-amber-950/60 text-fantasy-gold border-fantasy-gold/50' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Pengaturan API Key LLM"
          >
            <Key size={13} /> {apiKey ? 'Gemini 1.5' : 'Offline DM'}
          </button>

          <div className="text-right pl-2 border-l border-slate-800">
            <div className="text-xs font-bold text-slate-200">{character.name}</div>
            <div className="text-[11px] text-rose-400 font-semibold">{character.currentHp}/{character.maxHp} HP • 💰 {character.gold || 0} GP</div>
          </div>
        </div>
      </div>

      {/* Live State Mutation Popup Toast */}
      {mutationNotice && (
        <div className="bg-slate-900 border-2 border-fantasy-gold p-3 rounded-xl shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <Sparkles className="text-fantasy-gold animate-spin" size={18} />
            <div className="text-xs">
              <strong className="text-fantasy-gold">Update Petualangan: </strong>
              {mutationNotice.hp < 0 && <span className="text-rose-400 font-bold ml-1">Terluka {mutationNotice.hp} HP! </span>}
              {mutationNotice.hp > 0 && <span className="text-emerald-400 font-bold ml-1">Pulih +{mutationNotice.hp} HP! </span>}
              {mutationNotice.gold > 0 && <span className="text-amber-300 font-bold ml-1">+{mutationNotice.gold} Emas! </span>}
              {mutationNotice.item && <span className="text-purple-300 font-bold ml-1">Mendapat [{mutationNotice.item}]!</span>}
            </div>
          </div>
        </div>
      )}

      {/* Main Narrative Feed Box */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border/80 h-[460px] flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'player' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] uppercase font-cinzel font-bold text-fantasy-gold">
                  {msg.sender === 'dm' ? '🎙️ AI Dungeon Master' : `⚔️ ${character.name}`}
                </span>
                <span className="text-[10px] text-slate-500">{msg.timestamp}</span>

                {msg.sender === 'dm' && (
                  <button
                    type="button"
                    onClick={() => speakText(msg.text)}
                    className="text-slate-400 hover:text-fantasy-gold transition-colors"
                    title="Dengarkan Suara Narator (TTS)"
                  >
                    {isSpeaking ? <VolumeX size={12} className="text-fantasy-gold" /> : <Volume2 size={12} />}
                  </button>
                )}
              </div>
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'player'
                    ? 'bg-amber-600/30 text-amber-100 border border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-700/80 shadow-md font-serif'
                }`}
              >
                {msg.text.split('\n\n').map((paragraph, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {isAiTyping && (
            <div className="flex items-center gap-2 text-xs text-fantasy-gold italic p-2 font-cinzel">
              <Sparkles className="animate-spin" size={14} /> Dungeon Master sedang merangkai takdir narasi...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Action Panel Footer */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          {/* Active Skill Check Modal Alert */}
          {activeRollRequest && (
            <div className="bg-amber-950/40 border border-amber-500/80 p-3.5 rounded-xl flex flex-wrap justify-between items-center gap-2 animate-pulse">
              <div className="flex items-center gap-2">
                <Dices size={20} className="text-fantasy-gold" />
                <div className="text-xs">
                  <strong className="text-fantasy-gold font-cinzel">DICE CHECK: {activeRollRequest.type}</strong>
                  <span className="text-slate-300 ml-2">(Target DC: {activeRollRequest.dc}) — {activeRollRequest.reason}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const roll = Math.floor(Math.random() * 20) + 1;
                  handleResolveRoll({ die: 'D20', total: roll, raw: roll, isCrit: roll === 20, isFumble: roll === 1 });
                }}
                className="bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-cinzel font-bold text-xs px-4 py-1.5 rounded-lg shadow-gold-glow"
              >
                Lempar D20 Sekarang 🎲
              </button>
            </div>
          )}

          {/* Quick Choice Pills */}
          {!activeRollRequest && suggestedChoices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestedChoices.map((choice, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendChoice(choice)}
                  disabled={isAiTyping}
                  className="text-[11px] bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-fantasy-gold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-fantasy-gold/50 transition-all text-left disabled:opacity-50"
                >
                  ⚡ {choice}
                </button>
              ))}
            </div>
          )}

          {/* Player Custom Action Input Form */}
          <form onSubmit={handleSubmitAction} className="flex gap-2 items-center">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-fantasy-gold'
              }`}
              title="Input Suara (Speech-to-Text)"
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              type="text"
              value={inputAction}
              onChange={(e) => setInputAction(e.target.value)}
              placeholder={isListening ? 'Mendengarkan suara Anda...' : 'Ketik aksi petualangmu bebas di sini...'}
              disabled={isAiTyping}
              className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fantasy-gold"
            />
            <button
              type="submit"
              disabled={isAiTyping || !inputAction.trim()}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase px-5 py-2.5 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Send size={15} /> Kirim
            </button>
          </form>
        </div>
      </div>

      {/* API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 border border-fantasy-gold shadow-2xl space-y-4">
            <h3 className="font-cinzel text-fantasy-gold text-lg font-bold flex items-center gap-2">
              <Key size={18} /> Pengaturan LLM AI Gateway
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Anda dapat memasukkan <strong>Google Gemini API Key gratis</strong> untuk mengaktifkan kecerdasan Gemini 1.5 Flash, atau kosongkan untuk menggunakan simulator DM bawaan offline kami.
            </p>
            <input
              type="password"
              defaultValue={apiKey}
              id="apiKeyInput"
              placeholder="Masukkan AIzaSy..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = document.getElementById('apiKeyInput').value;
                  handleSaveApiKey(val);
                }}
                className="bg-fantasy-gold text-slate-950 font-cinzel font-bold text-xs px-4 py-2 rounded-xl"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
