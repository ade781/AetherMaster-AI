import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Sparkles,
  Footprints,
  Shield,
  Heart,
  Flame,
  ScrollText,
  Loader2
} from 'lucide-react';
import audio from '../services/audioService';

export default function CombatStage({
  character,
  combatState,
  backgroundId,
  onCombatAction,
  onResolveCombat,
  onFleeCombat,
  isLoading = false
}) {
  const enemyData = combatState?.enemy || {
    name: 'Musuh Misterius',
    sprite: 'monster_01_skeleton',
    maxHp: 30,
    hp: 30,
    ac: 12
  };

  const enemyHp = enemyData.hp ?? 0;
  const maxEnemyHp = enemyData.maxHp || 30;
  const playerHp = character?.hp ?? 0;
  const maxPlayerHp = character?.maxHp || 20;

  const [floatingTexts, setFloatingTexts] = useState([]);
  const [showSpellMenu, setShowSpellMenu] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);

  const enemyHpPercent = Math.max(0, Math.min(100, Math.round((enemyHp / maxEnemyHp) * 100)));
  const playerHpPercent = Math.max(0, Math.min(100, Math.round((playerHp / maxPlayerHp) * 100)));

  const round = combatState?.round || 1;
  const combatLog = combatState?.combatLog || [
    `Pertarungan dimulai! ${enemyData.name} (AC ${enemyData.ac || 12}) menghadang jalanmu.`
  ];

  // Resolve background based on props/state with fallback
  const resolvedBackground = () => {
    const bg = backgroundId || combatState?.backgroundId || 'bg_04_crimson_crypt';
    if (bg.startsWith('/') || bg.startsWith('http') || bg.startsWith('data:')) return bg;
    const clean = bg.replace(/\.png$/i, '');
    return `/assets/backgrounds/${clean}.png`;
  };

  // Play combat ambient soundscape during battle encounter
  useEffect(() => {
    const enemyName = (enemyData.name || '').toLowerCase();
    const isBoss = enemyName.includes('naga') ||
                   enemyName.includes('dragon') ||
                   enemyName.includes('vampire') ||
                   enemyName.includes('raja') ||
                   enemyName.includes('lord') ||
                   (maxEnemyHp >= 50);
    audio.startAmbient(isBoss ? 'boss' : 'combat');
    return () => {
      audio.stopAmbient();
    };
  }, [enemyData.name, maxEnemyHp]);

  const addFloating = (text, type, target) => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, text, type, target }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(f => f.id !== id));
    }, 1200);
  };

  const getMonsterSrc = (spriteName) => {
    if (!spriteName) return '/assets/monsters/monster_01_skeleton.png';
    if (spriteName.startsWith('/') || spriteName.startsWith('http')) return spriteName;
    return `/assets/monsters/${spriteName}.png`;
  };

  // Dispatch Action to Server
  const handleAction = async (action, itemId = null) => {
    if (isLoading || isConcluding || enemyHp <= 0) return;
    if (!onCombatAction) return;

    if (action === 'ATTACK') {
      audio.playSwordClash();
    } else if (action === 'CAST_SPELL') {
      audio.playSelect();
      setShowSpellMenu(false);
    } else if (action === 'FLEE') {
      audio.playClick();
    }

    const result = await onCombatAction(action, itemId);
    if (!result) return;

    // Trigger visual floating text from server results
    if (result.playerDamageDealt > 0) {
      addFloating(`-${result.playerDamageDealt}`, 'damage', 'enemy');
    }
    if (result.enemyDamageDealt > 0) {
      addFloating(`-${result.enemyDamageDealt}`, 'damage', 'player');
      audio.playSwordClash();
    }

    if (result.isVictory) {
      setIsConcluding(true);
      audio.playCriticalSuccess();
      setTimeout(() => {
        onResolveCombat?.();
      }, 1800);
    } else if (result.isFled) {
      setIsConcluding(true);
      setTimeout(() => {
        onFleeCombat?.();
      }, 1200);
    } else if (result.isGameOver) {
      audio.playCriticalFailure();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col lg:flex-row bg-slate-950 overflow-hidden select-none">
      {/* LEFT: Combat Arena */}
      <div className="relative flex-[3] xl:flex-[4] h-[55vh] lg:h-full flex flex-col justify-between p-6 overflow-hidden">
        {/* Arena Background */}
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.4] contrast-125 z-0"
          style={{ backgroundImage: `url('${resolvedBackground()}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80" />
        </div>

        {/* Top Encounter Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-cinzel font-bold shadow-lg">
            <Swords className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Pertempuran Taktis • Ronde {round}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Target AC: {enemyData.ac || 12}</span>
          </div>
        </div>

        {/* Center: Enemy Stage */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center">
          {/* Enemy Card & Vitals */}
          <div className="w-64 md:w-72 bg-slate-950/85 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-2.5 mb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel text-sm font-bold text-rose-300 truncate">
                {enemyData.name}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300">
                CR 1
              </span>
            </div>

            {/* Enemy HP Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  HP Musuh
                </span>
                <span className="text-rose-400 font-bold">{enemyHp} / {maxEnemyHp}</span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-700 to-rose-500"
                  animate={{ width: `${enemyHpPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Monster Sprite with Floating Numbers */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
            <motion.img
              src={getMonsterSrc(enemyData.sprite)}
              alt={enemyData.name}
              animate={enemyHp <= 0 ? { opacity: 0, scale: 0.8, filter: 'grayscale(100%)' } : { scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="max-h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)]"
              onError={(e) => { e.target.src = '/assets/monsters/monster_01_skeleton.png'; }}
            />

            {/* Floating Combat Numbers */}
            <AnimatePresence>
              {floatingTexts.filter(f => f.target === 'enemy').map(f => (
                <motion.div
                  key={f.id}
                  initial={{ y: 0, opacity: 1, scale: 1.2 }}
                  animate={{ y: -60, opacity: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  className={`absolute font-cinzel text-2xl md:text-3xl font-black drop-shadow-[0_4px_8px_rgba(0,0,0,1)] ${
                    f.type === 'damage' ? 'text-rose-500' : 'text-slate-300'
                  }`}
                >
                  {f.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Player Vital Quick HUD on Bottom Left */}
        <div className="relative z-10 w-full max-w-sm bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-cinzel font-bold text-amber-300">{character?.name || 'Ksatria'}</span>
            <span className="font-mono text-slate-300">{playerHp} / {maxPlayerHp} HP</span>
          </div>
          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              animate={{ width: `${playerHpPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300">
            <span>Mana: {character?.mana || 0} / {character?.maxMana || 15}</span>
            <span>Gold: {character?.gold || 0}</span>
          </div>

          {/* Floating text on player */}
          <AnimatePresence>
            {floatingTexts.filter(f => f.target === 'player').map(f => (
              <motion.div
                key={f.id}
                initial={{ y: 0, opacity: 1, scale: 1.2 }}
                animate={{ y: -40, opacity: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9 }}
                className={`absolute top-0 right-4 font-cinzel text-xl font-black drop-shadow ${
                  f.type === 'heal' ? 'text-emerald-400' : 'text-rose-500'
                }`}
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: Combat Commands & Combat Log */}
      <div className="relative flex-[2] xl:flex-[2] h-[45vh] lg:h-full flex flex-col justify-between bg-slate-900/95 border-l border-white/10 p-5 md:p-6 shadow-2xl z-20">

        {/* Combat Log Panel */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-2 pb-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
            <ScrollText className="w-4 h-4 text-amber-400" />
            <span>Catatan Pertempuran Resmi</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-outfit text-xs text-slate-300 leading-relaxed scrollbar-hide">
            {combatLog.map((log, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl border ${
                  i === 0
                    ? 'bg-slate-950/80 border-amber-400/40 text-amber-200'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Command Menu (Touch Target >= 48px) */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              disabled={isLoading || isConcluding || enemyHp <= 0}
              onClick={() => handleAction('ATTACK')}
              className="py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-cinzel font-bold text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
              <span>Serang (D20)</span>
            </button>

            <button
              disabled={isLoading || isConcluding || enemyHp <= 0}
              onClick={() => setShowSpellMenu(prev => !prev)}
              className="py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-cinzel font-bold text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sihir Arkanum</span>
            </button>

            <button
              disabled={isLoading || isConcluding || enemyHp <= 0 || !(character?.inventory || []).some(i => i && (i.category === 'Obat' || i.category === 'Potion' || i.category === 'consumable' || String(i.id).includes('potion')))}
              onClick={() => {
                const potion = (character?.inventory || []).find(i => i && (i.category === 'Obat' || i.category === 'Potion' || i.category === 'consumable' || String(i.id).includes('potion')));
                if (potion) handleAction('USE_ITEM', potion.id);
              }}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-cinzel font-semibold text-xs tracking-wider shadow flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Heart className="w-4 h-4" />
              <span>Gunakan Potion</span>
            </button>

            <button
              disabled={isLoading || isConcluding || enemyHp <= 0}
              onClick={() => handleAction('FLEE')}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-cinzel font-semibold text-xs tracking-wider border border-slate-700 shadow flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Footprints className="w-4 h-4" />
              <span>Taktik Kabur</span>
            </button>
          </div>

          {/* Spell Sub-menu Drawer */}
          {showSpellMenu && (
            <div className="p-3 bg-slate-950 border border-purple-500/40 rounded-xl space-y-2 animate-fadeIn">
              <span className="text-[10px] font-mono text-purple-300 uppercase font-bold block">
                Pilih Mantra Magis (Biaya: 5 Mana):
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  disabled={isLoading || (character?.mana || 0) < 5}
                  onClick={() => handleAction('CAST_SPELL')}
                  className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 hover:bg-red-900 disabled:opacity-40 text-red-200 text-xs font-medium flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fireball (2d6 + Stat Mod)</span>
                  </div>
                  <span className="font-mono text-[10px] text-amber-300">5 Mana</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
