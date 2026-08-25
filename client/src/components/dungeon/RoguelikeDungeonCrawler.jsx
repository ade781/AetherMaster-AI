import React, { useState, useEffect } from 'react';
import { Compass, RefreshCw, Key, Shield, Sparkles, Trophy, ArrowRight, Eye } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

const DUNGEON_SIZE = 7; // 7x7 Procedural Maze

export const RoguelikeDungeonCrawler = ({ character, onUpdateCharacter }) => {
  const [dungeonFloor, setDungeonFloor] = useState(1);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [grid, setGrid] = useState([]);
  const [explored, setExplored] = useState({});
  const [eventLog, setEventLog] = useState('Kamu menuruni tangga batu menuju lantai bawah tanah yang lembap dan gelap.');
  const [floorCleared, setFloorCleared] = useState(false);

  // Generate Procedural Dungeon Maze (Ponytail cellular/random walk)
  const generateNewFloor = (floorNum) => {
    const newGrid = [];
    const newExplored = { '0,0': true };

    for (let y = 0; y < DUNGEON_SIZE; y++) {
      const row = [];
      for (let x = 0; x < DUNGEON_SIZE; x++) {
        if (x === 0 && y === 0) {
          row.push('start');
        } else if (x === DUNGEON_SIZE - 1 && y === DUNGEON_SIZE - 1) {
          row.push('stairs');
        } else {
          const rand = Math.random();
          if (rand < 0.18) row.push('chest');
          else if (rand < 0.35) row.push('monster');
          else if (rand < 0.45) row.push('trap');
          else row.push('empty');
        }
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    setPlayerPos({ x: 0, y: 0 });
    setExplored(newExplored);
    setFloorCleared(false);
    setEventLog(`🚪 Memasuki Lantai Labirin Bawah Tanah ke-${floorNum}. Cari tangga menuju lantai berikutnya!`);
  };

  useEffect(() => {
    generateNewFloor(dungeonFloor);
  }, []);

  // Player Move
  const handleMove = (dx, dy) => {
    const nx = playerPos.x + dx;
    const ny = playerPos.y + dy;

    if (nx < 0 || nx >= DUNGEON_SIZE || ny < 0 || ny >= DUNGEON_SIZE) return;

    setPlayerPos({ x: nx, y: ny });
    setExplored((prev) => ({ ...prev, [`${nx},${ny}`]: true }));
    audioEngine.playDiceRoll();

    // Trigger cell event
    const cellType = grid[ny][nx];
    if (cellType === 'chest') {
      const gold = Math.floor(Math.random() * 15) + 10;
      audioEngine.playCoinDrop();
      setEventLog(`💎 Kamu menemukan Peti Kuno berisi +${gold} Koin Emas!`);
      giveGold(gold);
      // Remove chest after loot
      const updated = [...grid];
      updated[ny][nx] = 'empty';
      setGrid(updated);
    } else if (cellType === 'monster') {
      const dmg = Math.floor(Math.random() * 4) + 1;
      audioEngine.playSwordClash();
      setEventLog(`👹 Seekor Goblin Liar menyerang dari kegelapan menimbulkan ${dmg} damage sebelum kamu berhasil menebasnya!`);
      takeDamage(dmg);
      const updated = [...grid];
      updated[ny][nx] = 'empty';
      setGrid(updated);
    } else if (cellType === 'trap') {
      audioEngine.playSwordClash();
      setEventLog(`⚠️ Kamu menginjak pelat jebakan panah beracun! Terkena 3 damage luka.`);
      takeDamage(3);
    } else if (cellType === 'stairs') {
      audioEngine.playSpellCast();
      setFloorCleared(true);
      setEventLog(`✨ Kamu menemukan tangga menuju lantai yang lebih dalam!`);
    }
  };

  const takeDamage = async (dmg) => {
    const newHp = Math.max(1, (character.currentHp || 12) - dmg);
    try {
      await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentHp: newHp }),
      });
      if (onUpdateCharacter) onUpdateCharacter({ ...character, currentHp: newHp });
    } catch (e) {}
  };

  const giveGold = async (amt) => {
    const newGold = (character.gold || 0) + amt;
    try {
      await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gold: newGold }),
      });
      if (onUpdateCharacter) onUpdateCharacter({ ...character, gold: newGold });
    } catch (e) {}
  };

  const handleNextFloor = () => {
    const nextF = dungeonFloor + 1;
    setDungeonFloor(nextF);
    generateNewFloor(nextF);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-fantasy-gold flex items-center justify-center text-2xl shadow-gold-glow">
            🗝️
          </div>
          <div>
            <h2 className="font-cinzel text-fantasy-gold text-xl font-bold flex items-center gap-2">
              Labirin Roguelike Acak (Procedural Dungeon) — Lantai {dungeonFloor}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Tata letak ruangan, peti harta karun, dan monster ter-generate secara acak di setiap lantai
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => generateNewFloor(dungeonFloor)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-cinzel font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
        >
          <RefreshCw size={14} /> Acak Ulang Lantai Ini
        </button>
      </div>

      {/* Narrative Alert */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-xs sm:text-sm text-slate-200 leading-relaxed font-serif">
        📜 {eventLog}
      </div>

      {/* Main Dungeon Grid & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Maze Grid (7x7) */}
        <div className="lg:col-span-2 relative bg-slate-950 rounded-2xl p-4 border-2 border-fantasy-border shadow-2xl flex items-center justify-center">
          <div
            className="grid gap-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800"
            style={{
              gridTemplateColumns: `repeat(${DUNGEON_SIZE}, minmax(0, 1fr))`,
              width: '100%',
              maxWidth: '420px',
              aspectRatio: '1/1',
            }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => {
                const isPlayer = playerPos.x === x && playerPos.y === y;
                const isSeen = explored[`${x},${y}`];

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`rounded-lg flex items-center justify-center transition-all select-none ${
                      isPlayer
                        ? 'bg-sky-900/80 border-2 border-sky-400 shadow-md scale-105 z-10'
                        : !isSeen
                        ? 'bg-slate-950 border border-slate-900 opacity-90'
                        : cell === 'stairs'
                        ? 'bg-amber-950/80 border border-fantasy-gold'
                        : cell === 'chest'
                        ? 'bg-emerald-950/60 border border-emerald-700'
                        : cell === 'monster'
                        ? 'bg-rose-950/60 border border-rose-800'
                        : cell === 'trap'
                        ? 'bg-amber-950/40 border border-amber-800'
                        : 'bg-slate-900/60 border border-slate-800'
                    }`}
                  >
                    {isPlayer ? (
                      <span className="text-xl animate-bounce">🧙‍♂️</span>
                    ) : !isSeen ? (
                      <span className="text-[10px] text-slate-800 font-mono">?</span>
                    ) : cell === 'stairs' ? (
                      <span className="text-lg">🪜</span>
                    ) : cell === 'chest' ? (
                      <span className="text-base">📦</span>
                    ) : cell === 'monster' ? (
                      <span className="text-base">👺</span>
                    ) : cell === 'trap' ? (
                      <span className="text-sm">⚠️</span>
                    ) : (
                      <span className="text-[9px] text-slate-700 font-mono">·</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Direction Pad Controller */}
        <div className="glass-card rounded-2xl p-5 border border-fantasy-border flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-cinzel text-fantasy-gold font-bold text-xs uppercase tracking-wider mb-2">
              Kendali Langkah Pahlawan (D-Pad):
            </h4>
            <p className="text-slate-400 text-xs">
              Gunakan tombol arah untuk menjelajahi sudut koridor yang masih tertutup kabut kegelapan.
            </p>
          </div>

          {/* D-Pad Buttons */}
          <div className="flex flex-col items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => handleMove(0, -1)}
              className="w-12 h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fantasy-gold rounded-xl font-bold text-lg shadow-md transition-all active:scale-95"
            >
              ▲
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleMove(-1, 0)}
                className="w-12 h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fantasy-gold rounded-xl font-bold text-lg shadow-md transition-all active:scale-95"
              >
                ◀
              </button>
              <div className="w-12 h-12 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-center text-xs text-slate-600 font-bold">
                PAD
              </div>
              <button
                type="button"
                onClick={() => handleMove(1, 0)}
                className="w-12 h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fantasy-gold rounded-xl font-bold text-lg shadow-md transition-all active:scale-95"
              >
                ▶
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleMove(0, 1)}
              className="w-12 h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-fantasy-gold rounded-xl font-bold text-lg shadow-md transition-all active:scale-95"
            >
              ▼
            </button>
          </div>

          {/* Next Floor Action */}
          {floorCleared && (
            <button
              type="button"
              onClick={handleNextFloor}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase py-3 rounded-xl shadow-gold-glow flex items-center justify-center gap-1.5 transition-all animate-bounce"
            >
              Turun ke Lantai {dungeonFloor + 1} 🪜
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
