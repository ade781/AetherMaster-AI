import React, { useState, useEffect } from 'react';
import { MONSTER_BESTIARY } from '../../data/monsters';
import { CombatVictoryModal } from './CombatVictoryModal';
import { audioEngine } from '../../services/audioEngine';
import { Swords, Shield, Heart, Zap, ArrowLeft, RefreshCw, Wand2, Plus, Sparkles } from 'lucide-react';

const GRID_SIZE = 8; // 8x8 Tactical Grid

export const BattleGridMap = ({ character, onExitCombat, onUpdateCharacter }) => {
  const [selectedMonster, setSelectedMonster] = useState(MONSTER_BESTIARY[0]);
  const [monsterState, setMonsterState] = useState({ ...MONSTER_BESTIARY[0], x: 6, y: 1 });
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 6 });
  const [playerHp, setPlayerHp] = useState(character.currentHp || 10);
  const [turn, setTurn] = useState('player'); // 'player' | 'monster'
  const [movementLeft, setMovementLeft] = useState(3);
  const [actionUsed, setActionUsed] = useState(false);
  const [combatLogs, setCombatLogs] = useState([
    { id: 1, text: `Pertarungan taktis dimulai! Inisiatif berada di tanganmu, ${character.name}!`, type: 'info' }
  ]);
  const [floatingText, setFloatingText] = useState(null); // { text, x, y, color }
  const [showVictory, setShowVictory] = useState(false);

  // Switch monster opponent
  const handleSelectOpponent = (m) => {
    setSelectedMonster(m);
    setMonsterState({ ...m, x: 6, y: 1 });
    setPlayerPos({ x: 1, y: 6 });
    setPlayerHp(character.currentHp);
    setTurn('player');
    setMovementLeft(3);
    setActionUsed(false);
    setShowVictory(false);
    setCombatLogs([{ id: Date.now(), text: `Musuh baru muncul: ${m.name}! Bersiap bertarung!`, type: 'info' }]);
  };

  // Trigger floating damage number popup
  const showDamagePopup = (text, targetPos, color = '#e74c3c') => {
    setFloatingText({ text, x: targetPos.x, y: targetPos.y, color });
    setTimeout(() => setFloatingText(null), 1200);
  };

  // Distance calculator
  const getDistance = (posA, posB) => {
    return Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y);
  };

  // Player Move
  const handleCellClick = (x, y) => {
    if (turn !== 'player') return;
    if (x === monsterState.x && y === monsterState.y) return;

    const dist = getDistance(playerPos, { x, y });
    if (dist <= movementLeft && dist > 0) {
      setPlayerPos({ x, y });
      setMovementLeft(prev => prev - dist);
      audioEngine.playDiceRoll();
      addLog(`Kamu bergerak ke petak (${x + 1}, ${y + 1}).`);
    }
  };

  // Player Attack
  const handlePlayerAttack = (type = 'melee') => {
    if (turn !== 'player' || actionUsed) return;

    const dist = getDistance(playerPos, monsterState);
    const maxRange = type === 'melee' ? 1 : 4;

    if (dist > maxRange) {
      alert(`Musuh berada di luar jangkauan serangan ${type === 'melee' ? 'jarak dekat (1 petak)' : 'jarak jauh (4 petak)'}!`);
      return;
    }

    setActionUsed(true);

    // D20 Attack roll
    const d20 = Math.floor(Math.random() * 20) + 1;
    const totalAttack = d20 + (character.proficiencyBonus || 2) + Math.floor(((character.strength || 10) - 10) / 2);

    if (d20 === 20 || totalAttack >= monsterState.armorClass) {
      audioEngine.playSwordClash();
      const dmg = Math.floor(Math.random() * 8) + 3;
      const newMhp = Math.max(0, monsterState.currentHp - dmg);

      setMonsterState(prev => ({ ...prev, currentHp: newMhp }));
      showDamagePopup(`-${dmg} HP`, monsterState, '#e74c3c');
      addLog(`⚔️ Seranganmu MENGENAI ${monsterState.name} sebesar ${dmg} damage luka! (Roll: ${totalAttack} vs AC ${monsterState.armorClass})`, 'success');

      if (newMhp <= 0) {
        setTimeout(() => setShowVictory(true), 800);
      }
    } else {
      audioEngine.playDiceRoll();
      showDamagePopup('MELESET!', monsterState, '#95a5a6');
      addLog(`💨 Seranganmu MELESET dari ${monsterState.name}! (Roll: ${totalAttack} vs AC ${monsterState.armorClass})`, 'warning');
    }
  };

  // Player Cast Spell
  const handlePlayerSpell = () => {
    if (turn !== 'player' || actionUsed) return;
    setActionUsed(true);

    audioEngine.playSpellCast();
    const dmg = Math.floor(Math.random() * 10) + 4;
    const newMhp = Math.max(0, monsterState.currentHp - dmg);

    setMonsterState(prev => ({ ...prev, currentHp: newMhp }));
    showDamagePopup(`🔥 -${dmg} Sihir`, monsterState, '#9b59b6');
    addLog(`✨ Kamu melontarkan Mantra Sihir Api ke ${monsterState.name} menimbulkan ${dmg} damage!`, 'success');

    if (newMhp <= 0) {
      setTimeout(() => setShowVictory(true), 800);
    }
  };

  // Player Drink Potion
  const handlePlayerHeal = () => {
    if (turn !== 'player' || actionUsed) return;
    setActionUsed(true);

    audioEngine.playSpellCast();
    const heal = Math.floor(Math.random() * 6) + 4;
    const newPhp = Math.min(character.maxHp, playerHp + heal);
    setPlayerHp(newPhp);
    showDamagePopup(`+${heal} HP`, playerPos, '#2ecc71');
    addLog(`🧪 Kamu meminum Ramuan Pemulih dan memulihkan +${heal} HP!`, 'heal');
  };

  // End Turn -> Trigger Monster AI
  const handleEndTurn = () => {
    setTurn('monster');
    setMovementLeft(3);
    setActionUsed(false);
    addLog(`Giliranmu selesai. ${monsterState.name} bersiap mengambil giliran!`);

    // Monster AI execution delay
    setTimeout(() => {
      executeMonsterTurn();
    }, 900);
  };

  // Monster AI Engine
  const executeMonsterTurn = () => {
    if (monsterState.currentHp <= 0) return;

    let newMx = monsterState.x;
    let newMy = monsterState.y;

    // AI Pathfinding: Move 1-2 steps toward player
    const dx = playerPos.x - newMx;
    const dy = playerPos.y - newMy;

    if (Math.abs(dx) + Math.abs(dy) > 1) {
      if (Math.abs(dx) > Math.abs(dy)) {
        newMx += dx > 0 ? 1 : -1;
      } else {
        newMy += dy > 0 ? 1 : -1;
      }
      setMonsterState(prev => ({ ...prev, x: newMx, y: newMy }));
    }

    // Monster Attack if in range
    const distAfterMove = Math.abs(playerPos.x - newMx) + Math.abs(playerPos.y - newMy);

    setTimeout(() => {
      if (distAfterMove <= (monsterState.aiType === 'ranged' ? 3 : 1)) {
        const d20 = Math.floor(Math.random() * 20) + 1;
        const totalAtk = d20 + monsterState.attackBonus;

        if (d20 === 20 || totalAtk >= character.armorClass) {
          audioEngine.playSwordClash();
          const dmg = Math.floor(Math.random() * 5) + 2;
          const newPhp = Math.max(0, playerHp - dmg);
          setPlayerHp(newPhp);
          showDamagePopup(`-${dmg} HP`, playerPos, '#e74c3c');
          addLog(`💥 ${monsterState.name} melancarkan ${monsterState.attackName} dan MENGENAI kamu sebesar ${dmg} damage! (Roll: ${totalAtk} vs AC ${character.armorClass})`, 'danger');
        } else {
          audioEngine.playDiceRoll();
          showDamagePopup('DITANGKIS!', playerPos, '#3498db');
          addLog(`🛡️ Serangan ${monsterState.name} BERHASIL kamu tangkis! (Roll: ${totalAtk} vs AC ${character.armorClass})`, 'info');
        }
      } else {
        addLog(`${monsterState.name} mendekat namun masih terlalu jauh untuk menyerang.`);
      }

      // Return turn to player
      setTimeout(() => {
        setTurn('player');
        setMovementLeft(3);
        setActionUsed(false);
        addLog(`Giliran kembali kepadamu, ${character.name}!`);
      }, 700);
    }, 700);
  };

  const addLog = (text, type = 'normal') => {
    setCombatLogs(prev => [...prev, { id: Date.now(), text, type }]);
  };

  const handleClaimReward = async () => {
    const earnedGold = (character.gold || 0) + selectedMonster.goldReward;
    const earnedExp = (character.experience || 0) + selectedMonster.expReward;

    try {
      await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gold: earnedGold,
          experience: earnedExp,
          currentHp: playerHp,
        }),
      });

      if (onUpdateCharacter) {
        onUpdateCharacter({
          ...character,
          gold: earnedGold,
          experience: earnedExp,
          currentHp: playerHp,
        });
      }
    } catch (e) {}

    setShowVictory(false);
    onExitCombat();
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center bg-slate-900/90 border border-fantasy-border p-4 rounded-2xl gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExitCombat}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs font-bold font-cinzel flex items-center gap-1.5"
          >
            <ArrowLeft size={16} /> Keluar Tempur
          </button>
          <div>
            <h3 className="font-cinzel text-fantasy-gold font-bold text-base flex items-center gap-2">
              <Swords size={18} /> Mode Pertarungan Taktis 2D Grid
            </h3>
            <span className="text-xs text-slate-400">
              Lawan: <strong className="text-amber-300">{monsterState.name}</strong> (CR {monsterState.cr})
            </span>
          </div>
        </div>

        {/* Turn Status Pill */}
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1.5 rounded-xl font-cinzel font-bold border transition-all ${
            turn === 'player'
              ? 'bg-amber-500/20 text-fantasy-gold border-fantasy-gold shadow-gold-glow animate-pulse'
              : 'bg-rose-950/80 text-rose-300 border-rose-600'
          }`}>
            {turn === 'player' ? '⚡ Giliran Pemain' : '👹 Giliran Monster AI'}
          </span>
        </div>
      </div>

      {/* Opponent Selector Pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-400 font-medium">Pilih Lawan Monster:</span>
        {MONSTER_BESTIARY.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleSelectOpponent(m)}
            className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
              selectedMonster.id === m.id
                ? 'bg-fantasy-gold text-slate-950 font-bold border-fantasy-gold'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            {m.icon} {m.name}
          </button>
        ))}
      </div>

      {/* Main Grid Battle Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2D Board Grid (8x8) */}
        <div className="lg:col-span-2 relative bg-slate-950 rounded-2xl p-4 border-2 border-fantasy-border shadow-2xl flex items-center justify-center">
          <div
            className="grid gap-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: '100%',
              maxWidth: '480px',
              aspectRatio: '1/1',
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
              const x = idx % GRID_SIZE;
              const y = Math.floor(idx / GRID_SIZE);
              const isPlayer = playerPos.x === x && playerPos.y === y;
              const isMonster = monsterState.x === x && monsterState.y === y;
              const distFromPlayer = getDistance(playerPos, { x, y });
              const inMoveRange = turn === 'player' && distFromPlayer <= movementLeft && distFromPlayer > 0;

              return (
                <div
                  key={idx}
                  onClick={() => handleCellClick(x, y)}
                  className={`relative rounded-lg flex items-center justify-center transition-all cursor-pointer select-none ${
                    isPlayer
                      ? 'bg-sky-900/60 border-2 border-sky-400 shadow-md scale-105 z-10'
                      : isMonster
                      ? 'bg-rose-950/80 border-2 border-rose-500 shadow-md scale-105 z-10'
                      : inMoveRange
                      ? 'bg-amber-950/25 border border-fantasy-gold/50 hover:bg-amber-900/40'
                      : 'bg-slate-900/40 border border-slate-800/80 hover:bg-slate-850'
                  }`}
                >
                  {/* Grid Coordinate hint */}
                  <span className="absolute top-0.5 left-1 text-[8px] text-slate-600 font-mono">
                    {x + 1},{y + 1}
                  </span>

                  {/* Player Token */}
                  {isPlayer && (
                    <div className="flex flex-col items-center animate-bounce">
                      <span className="text-xl">🧙‍♂️</span>
                      <div className="w-8 h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${(playerHp / character.maxHp) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Monster Token */}
                  {isMonster && (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">{monsterState.icon}</span>
                      <div className="w-8 h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                        <div
                          className="h-full bg-rose-500"
                          style={{ width: `${(monsterState.currentHp / monsterState.maxHp) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Floating Damage Numbers */}
                  {floatingText && floatingText.x === x && floatingText.y === y && (
                    <div
                      className="absolute -top-4 font-black font-cinzel text-base drop-shadow-md animate-bounce z-30 pointer-events-none"
                      style={{ color: floatingText.color }}
                    >
                      {floatingText.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Combat Controls & Action Economy */}
        <div className="space-y-4">
          {/* Vitals Summary Card */}
          <div className="glass-card rounded-2xl p-4 border border-fantasy-border space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-200">{character.name}</div>
                <div className="text-[11px] text-emerald-400 font-semibold">{playerHp}/{character.maxHp} HP • AC {character.armorClass}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-rose-300">{monsterState.name}</div>
                <div className="text-[11px] text-rose-400 font-semibold">{monsterState.currentHp}/{monsterState.maxHp} HP • AC {monsterState.armorClass}</div>
              </div>
            </div>

            <div className="text-xs text-slate-300 flex justify-between">
              <span>Sisa Gerak Langkah:</span>
              <strong className="text-fantasy-gold">{movementLeft} Kotak</strong>
            </div>
            <div className="text-xs text-slate-300 flex justify-between">
              <span>Status Aksi:</span>
              <strong className={actionUsed ? 'text-rose-400' : 'text-emerald-400'}>
                {actionUsed ? 'Sudah Dipakai' : 'Siap Menyerang'}
              </strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="glass-card rounded-2xl p-4 border border-fantasy-border space-y-2">
            <h4 className="font-cinzel text-fantasy-gold font-bold text-xs uppercase tracking-wider mb-2">
              Pilihan Aksi Pertempuran:
            </h4>

            <button
              type="button"
              onClick={() => handlePlayerAttack('melee')}
              disabled={turn !== 'player' || actionUsed}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs py-2.5 px-3 rounded-xl border border-slate-700 hover:border-fantasy-gold flex items-center justify-between transition-all disabled:opacity-40"
            >
              <span className="flex items-center gap-2">⚔️ Tebas Pedang (Jarak Dekat)</span>
              <span className="text-[10px] text-slate-400">1d8+STR</span>
            </button>

            <button
              type="button"
              onClick={() => handlePlayerAttack('ranged')}
              disabled={turn !== 'player' || actionUsed}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs py-2.5 px-3 rounded-xl border border-slate-700 hover:border-fantasy-gold flex items-center justify-between transition-all disabled:opacity-40"
            >
              <span className="flex items-center gap-2">🏹 Tembak Busur (Jarak Jauh)</span>
              <span className="text-[10px] text-slate-400">1d6+DEX</span>
            </button>

            <button
              type="button"
              onClick={handlePlayerSpell}
              disabled={turn !== 'player' || actionUsed}
              className="w-full bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 font-semibold text-xs py-2.5 px-3 rounded-xl border border-purple-800 flex items-center justify-between transition-all disabled:opacity-40"
            >
              <span className="flex items-center gap-2">✨ Rapalkan Sihir Api (Firebolt)</span>
              <span className="text-[10px] text-purple-400">1d10 Api</span>
            </button>

            <button
              type="button"
              onClick={handlePlayerHeal}
              disabled={turn !== 'player' || actionUsed}
              className="w-full bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-200 font-semibold text-xs py-2.5 px-3 rounded-xl border border-emerald-800 flex items-center justify-between transition-all disabled:opacity-40"
            >
              <span className="flex items-center gap-2">🧪 Minum Ramuan Pemulih</span>
              <span className="text-[10px] text-emerald-400">+2d4+2 HP</span>
            </button>

            <button
              type="button"
              onClick={handleEndTurn}
              disabled={turn !== 'player'}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase py-2.5 px-3 rounded-xl shadow-gold-glow mt-3 transition-all disabled:opacity-40"
            >
              Akhiri Giliran ⏩
            </button>
          </div>

          {/* Combat Log Box */}
          <div className="glass-card rounded-2xl p-3.5 border border-fantasy-border max-h-40 overflow-y-auto space-y-1 text-xs">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Log Pertempuran:</div>
            {combatLogs.slice(-6).map((log) => (
              <div
                key={log.id}
                className={`text-[11px] leading-relaxed ${
                  log.type === 'success'
                    ? 'text-emerald-400 font-medium'
                    : log.type === 'danger'
                    ? 'text-rose-400 font-medium'
                    : log.type === 'warning'
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}
              >
                {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Victory Modal */}
      {showVictory && (
        <CombatVictoryModal
          monster={selectedMonster}
          expEarned={selectedMonster.expReward}
          goldEarned={selectedMonster.goldReward}
          onClaimReward={handleClaimReward}
        />
      )}
    </div>
  );
};
