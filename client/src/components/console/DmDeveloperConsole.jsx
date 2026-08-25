import React, { useState } from 'react';
import { Terminal, Send, X, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

export const DmDeveloperConsole = ({ character, onUpdateCharacter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState([
    { text: '⚔️ [AetherMaster AI Console] Siap menerima perintah macro.', type: 'info' },
    { text: 'Ketik "/help" untuk melihat daftar perintah.', type: 'hint' },
  ]);

  const handleRunCommand = (e) => {
    e.preventDefault();
    const cmd = command.trim();
    if (!cmd) return;

    addLog(`> ${cmd}`, 'input');
    setCommand('');

    const lower = cmd.toLowerCase();

    // /help
    if (lower === '/help') {
      addLog('📜 Daftar Perintah Macro Console:', 'info');
      addLog('  • /roll [X]d[Y]+[Z]  -> Contoh: /roll 2d20+5 atau /roll 4d6', 'hint');
      addLog('  • /heal [jumlah]      -> Contoh: /heal 20 (Pulihkan HP)', 'hint');
      addLog('  • /damage [jumlah]    -> Contoh: /damage 10 (Kurangi HP)', 'hint');
      addLog('  • /gold [jumlah]      -> Contoh: /gold 100 (Tambah koin emas)', 'hint');
      addLog('  • /spawn [nama_item]  -> Contoh: /spawn Pedang Naga Pusaka', 'hint');
      addLog('  • /clear              -> Bersihkan layar terminal', 'hint');
      return;
    }

    // /clear
    if (lower === '/clear') {
      setLogs([]);
      return;
    }

    // /roll
    if (lower.startsWith('/roll')) {
      const match = lower.match(/\/roll\s+(\d+)d(\d+)(?:\+(\d+))?/);
      if (match) {
        const count = parseInt(match[1], 10);
        const sides = parseInt(match[2], 10);
        const mod = parseInt(match[3] || '0', 10);

        let rolls = [];
        let sum = 0;
        for (let i = 0; i < count; i++) {
          const r = Math.floor(Math.random() * sides) + 1;
          rolls.push(r);
          sum += r;
        }
        const total = sum + mod;
        audioEngine.playDiceRoll();
        addLog(`🎲 Hasil Lemparan: [${rolls.join(', ')}] + ${mod} = ${total}`, 'success');
      } else {
        const simple = Math.floor(Math.random() * 20) + 1;
        audioEngine.playDiceRoll();
        addLog(`🎲 Hasil D20: ${simple}`, 'success');
      }
      return;
    }

    // /heal
    if (lower.startsWith('/heal')) {
      const amt = parseInt(lower.split(' ')[1], 10) || 10;
      const newHp = Math.min(character.maxHp || 20, (character.currentHp || 10) + amt);
      audioEngine.playSpellCast();
      addLog(`✨ Memulihkan +${amt} HP! (HP Sekarang: ${newHp}/${character.maxHp})`, 'success');
      updateChar({ currentHp: newHp });
      return;
    }

    // /damage
    if (lower.startsWith('/damage')) {
      const amt = parseInt(lower.split(' ')[1], 10) || 5;
      const newHp = Math.max(0, (character.currentHp || 10) - amt);
      audioEngine.playSwordClash();
      addLog(`💥 Terkena ${amt} damage luka! (HP Sekarang: ${newHp}/${character.maxHp})`, 'danger');
      updateChar({ currentHp: newHp });
      return;
    }

    // /gold
    if (lower.startsWith('/gold')) {
      const amt = parseInt(lower.split(' ')[1], 10) || 50;
      const newGold = (character.gold || 0) + amt;
      audioEngine.playCoinDrop();
      addLog(`💰 Menambahkan +${amt} GP! (Total Emas: ${newGold} GP)`, 'success');
      updateChar({ gold: newGold });
      return;
    }

    // /spawn
    if (lower.startsWith('/spawn')) {
      const itemName = cmd.replace(/\/spawn\s+/i, '').trim() || 'Item Pusaka Gaib';
      const newItem = {
        id: `spawned_${Date.now()}`,
        name: itemName,
        type: 'item',
        desc: 'Item yang diciptakan melalui perintah sakti DM Console.',
        weight: 1,
        quantity: 1,
      };
      const updatedInv = [...(character.inventory || []), newItem];
      audioEngine.playSpellCast();
      addLog(`🎁 Memunculkan item [${itemName}] ke dalam tas inventaris!`, 'success');
      updateChar({ inventory: updatedInv });
      return;
    }

    addLog(`Perintah tidak dikenali: "${cmd}". Ketik /help untuk panduan.`, 'warning');
  };

  const updateChar = async (data) => {
    try {
      await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (onUpdateCharacter) {
        onUpdateCharacter({ ...character, ...data });
      }
    } catch (e) {}
  };

  const addLog = (text, type = 'normal') => {
    setLogs((prev) => [...prev, { id: Date.now() + Math.random(), text, type }]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 bg-slate-900/90 hover:bg-slate-800 text-fantasy-gold border border-fantasy-gold/60 p-3 rounded-full shadow-gold-glow flex items-center gap-1.5 font-mono text-xs transition-all hover:scale-110"
        title="Buka DM Developer Macro Console"
      >
        <Terminal size={16} />
        <span className="font-bold hidden sm:inline">DM Console</span>
      </button>

      {/* Floating Modal Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-96 max-w-[90vw] bg-slate-950/95 border-2 border-fantasy-gold rounded-2xl shadow-2xl overflow-hidden font-mono flex flex-col h-80 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-slate-900 p-3 border-b border-slate-800 flex justify-between items-center text-xs text-fantasy-gold font-bold">
            <span className="flex items-center gap-1.5">
              <Terminal size={14} /> DM Macro Console
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <X size={14} />
            </button>
          </div>

          {/* Logs Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1 text-[11px]">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.type === 'input'
                    ? 'text-slate-400 font-bold'
                    : log.type === 'success'
                    ? 'text-emerald-400'
                    : log.type === 'danger'
                    ? 'text-rose-400'
                    : log.type === 'warning'
                    ? 'text-amber-400'
                    : log.type === 'hint'
                    ? 'text-slate-500'
                    : 'text-slate-300'
                }
              >
                {log.text}
              </div>
            ))}
          </div>

          {/* Form Command Input */}
          <form onSubmit={handleRunCommand} className="p-2 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Ketik perintah (contoh: /roll 2d20+5)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
            />
            <button
              type="submit"
              className="bg-fantasy-gold text-slate-950 font-bold px-3 py-1 rounded-lg text-xs hover:bg-amber-400"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
