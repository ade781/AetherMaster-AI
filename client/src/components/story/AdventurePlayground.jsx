import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sparkles, Send, Dices, ArrowLeft, Volume2, Flame, RefreshCw, Compass } from 'lucide-react';

export const AdventurePlayground = ({ character, story, onExit, onTriggerDice }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'dm',
      text: `${story.introPrompt}\n\nLokasi: ${story.startingLocation}. Apa yang ingin kamu lakukan, ${character.name}?`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    }
  ]);
  const [inputAction, setInputAction] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  const handleSendChoice = (choiceText) => {
    executeAction(choiceText);
  };

  const handleSubmitAction = (e) => {
    e.preventDefault();
    if (!inputAction.trim()) return;
    executeAction(inputAction);
    setInputAction('');
  };

  const executeAction = (actionText) => {
    const userMsg = {
      id: Date.now(),
      sender: 'player',
      text: actionText,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAiTyping(true);

    // AI DM Simulation Response
    setTimeout(() => {
      let dmReply = '';
      if (actionText.toLowerCase().includes('obor') || actionText.toLowerCase().includes('masuk')) {
        dmReply = `Kamu melangkah maju dengan hati-hati menelusuri koridor batu. Cahaya obormu menari-nari di dinding yang lembap. Di ujung lorong, kamu melihat sebuah peti batu besar yang diapit oleh dua patung kesatria bersenjata kapak. Tiba-tiba, mata patung tersebut menyala biru redup! Lempar dadu D20 (Perception / Initiative Check) untuk bertindak cepat!`;
      } else if (actionText.toLowerCase().includes('rune') || actionText.toLowerCase().includes('periksa')) {
        dmReply = `Jari-jarimu menyentuh ukiran rune di dinding batu kuno. Rune tersebut bertuliskan aksara Draconic kuno: "Hanya mereka yang berhati berani dan berjiwa suci yang dapat melewati gerbang Makam Surya tanpa terbakar api pembalasan." Kamu menyadari ada mekanisme pelat jebakan di lantai 3 langkah di depanmu!`;
      } else {
        dmReply = `Aksi kamu membuat suasana semakin tegang. Angin dingin berhembus kencang membuat kobaran obor meredup sesaat. Di hadapanmu, bayangan misterius bergerak cepat di sudut ruangan. Dungeon Master meminta kamu bersiap melempar dadu D20 untuk menentukan hasil dari tindakanmu!`;
      }

      const dmMsg = {
        id: Date.now() + 1,
        sender: 'dm',
        text: dmReply,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      };

      setMessages(prev => [...prev, dmMsg]);
      setIsAiTyping(false);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Top Session Bar */}
      <div className="flex flex-wrap justify-between items-center bg-slate-900/90 border border-fantasy-border p-4 rounded-2xl gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs font-bold font-cinzel flex items-center gap-1.5"
          >
            <ArrowLeft size={16} /> Keluar Sesi
          </button>
          <div>
            <h3 className="font-cinzel text-fantasy-gold font-bold text-sm sm:text-base">{story.title}</h3>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Compass size={12} className="text-fantasy-gold" /> {story.startingLocation}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-200">{character.name}</div>
            <div className="text-[11px] text-rose-400 font-semibold">{character.currentHp}/{character.maxHp} HP • AC {character.armorClass}</div>
          </div>
          <img
            src={character.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${character.name}`}
            alt={character.name}
            className="w-9 h-9 rounded-xl border border-fantasy-gold"
          />
        </div>
      </div>

      {/* Main Narrative Feed Box */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border/80 h-[480px] flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'player' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] uppercase font-cinzel font-bold text-fantasy-gold">
                  {msg.sender === 'dm' ? '🎙️ AI Dungeon Master' : `⚔️ ${character.name}`}
                </span>
                <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
              </div>
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
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

        {/* Quick Initial Choice Pills */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1">
            <Sparkles size={12} className="text-fantasy-gold" /> Opsi Pilihan Aksi Cepat:
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {story.initialChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => handleSendChoice(choice.text)}
                disabled={isAiTyping}
                className="text-[11px] bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-fantasy-gold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-fantasy-gold/50 transition-all text-left disabled:opacity-50"
              >
                ⚡ {choice.text}
              </button>
            ))}
          </div>

          {/* Player Custom Action Input Form */}
          <form onSubmit={handleSubmitAction} className="flex gap-2">
            <input
              type="text"
              value={inputAction}
              onChange={(e) => setInputAction(e.target.value)}
              placeholder="Ketik tindakan atau aksi petualangmu bebas di sini..."
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
    </div>
  );
};
