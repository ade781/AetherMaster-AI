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
  Loader2,
  Trophy,
  Skull
} from 'lucide-react';
import audio from '../services/audioService';
import { useGameStore } from '../store/GameContext';
import DiceRoller from './combat/DiceRoller';
import TurnOrderBar from './combat/TurnOrderBar';
import StatusEffectBadge from './combat/StatusEffectBadge';

export default function CombatStage({
  character,
  combatState,
  backgroundId,
  onCombatAction,
  onResolveCombat,
  onFleeCombat,
  isLoading = false
}) {
  const { saveStatus } = useGameStore();
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
  const [enemyHitShake, setEnemyHitShake] = useState(false);
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);

  const enemyHpPercent = Math.max(0, Math.min(100, Math.round((enemyHp / maxEnemyHp) * 100)));
  const playerHpPercent = Math.max(0, Math.min(100, Math.round((playerHp / maxPlayerHp) * 100)));
  const statMod = Math.max(0, Math.floor(((character?.str ?? 14) - 10) / 2));

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
    }, 1100);
  };

  const getMonsterSrc = (spriteName) => {
    if (!spriteName) return '/assets/monsters/monster_01_skeleton.png';
    if (spriteName.startsWith('/') || spriteName.startsWith('http')) return spriteName;
    return `/assets/monsters/${spriteName}.png`;
  };

  // Available consumable potions count
  const potionCount = (character?.inventory || []).filter(i =>
    i && (i.category === 'Obat' || i.category === 'Potion' || i.category === 'consumable' || String(i.id).includes('potion'))
  ).length;

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
      setEnemyHitShake(true);
      setTimeout(() => setEnemyHitShake(false), 400);
      addFloating(`-${result.playerDamageDealt} Dmg`, 'damage', 'enemy');
    }
    if (result.enemyDamageDealt > 0) {
      addFloating(`-${result.enemyDamageDealt} Dmg`, 'damage', 'player');
      audio.playSwordClash();
    }

    if (result.isVictory) {
      setIsConcluding(true);
      audio.playCriticalSuccess();
      setTimeout(() => {
        onResolveCombat?.();
      }, 1600);
    } else if (result.isFled) {
      setIsConcluding(true);
      setTimeout(() => {
        onFleeCombat?.();
      }, 1100);
    } else if (result.isGameOver) {
      audio.playCriticalFailure();
    }
  };

  const handleDiceRollComplete = async (rollData) => {
    setIsDiceRollerOpen(false);
    if (rollData.isCriticalHit) {
      addFloating('NATURAL 20!', 'crit', 'enemy');
    } else if (rollData.isCriticalMiss) {
      addFloating('FUMBLE 1!', 'miss', 'player');
    }
    await handleAction('ATTACK');
  };

  return (
    <div className="relative w-full h-full flex flex-col lg:flex-row bg-slate-950 overflow-hidden select-none">
      {/* LEFT: Combat Arena Stage */}
      <div className="relative flex-[3] xl:flex-[4] h-[52vh] lg:h-full flex flex-col justify-between p-4 md:p-6 overflow-hidden">
        {/* Arena Background */}
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.35] contrast-125 z-0"
          style={{ backgroundImage: `url('${resolvedBackground()}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/80" />
        </div>

        {/* Top Encounter Header */}
        <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
          <TurnOrderBar
            round={round}
            activeTurn="player"
            character={character}
            enemy={enemyData}
          />

          {/* Save Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg text-[11px]">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-amber-300 font-medium animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                <span>Menyimpan...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Tersimpan</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium" title="Autosave belum berhasil, akan dicoba kembali otomatis">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Gagal simpan</span>
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
                <span>Tersimpan</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Target AC: {enemyData.ac || 12}</span>
          </div>
        </div>

        {/* Center: Enemy Monster & Vitals */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center">
          {/* Enemy Card & Vitals */}
          <div className="w-64 md:w-72 bg-slate-950/85 border border-white/10 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel text-sm font-bold text-rose-200 truncate">
                {enemyData.name}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-rose-950/80 border border-rose-700/60 text-rose-300 font-semibold">
                Musuh
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
                  className="h-full bg-gradient-to-r from-rose-700 to-rose-500 rounded-full"
                  animate={{ width: `${enemyHpPercent}%` }}
                  transition={{ duration: 0.25 }}
                />
              </div>
            </div>

            {/* Enemy Status Effect Badges */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {(enemyData.statusEffects || (enemyHpPercent <= 30 ? ['weakened'] : [])).map((eff, i) => (
                <StatusEffectBadge key={i} effectId={eff} />
              ))}
            </div>
          </div>

          {/* Monster Sprite with Hit Reaction */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 flex items-center justify-center">
            <motion.img
              src={getMonsterSrc(enemyData.sprite)}
              alt={enemyData.name}
              animate={
                enemyHp <= 0
                  ? { opacity: 0, scale: 0.7, filter: 'grayscale(100%)' }
                  : enemyHitShake
                  ? { x: [-8, 8, -6, 6, 0], scale: 1.05 }
                  : { scale: [1, 1.015, 1] }
              }
              transition={{ repeat: enemyHp > 0 && !enemyHitShake ? Infinity : 0, duration: 2.5 }}
              className="max-h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]"
              onError={(e) => { e.currentTarget.src = '/assets/monsters/monster_01_skeleton.png'; }}
            />

            {/* Victory Banner Overlay */}
            {enemyHp <= 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl backdrop-blur-sm"
              >
                <Trophy className="w-8 h-8 text-amber-400 mb-1" />
                <span className="font-cinzel text-lg font-bold text-amber-300">Kemenangan!</span>
              </motion.div>
            )}

            {/* Floating Combat Numbers */}
            <AnimatePresence>
              {floatingTexts.filter(f => f.target === 'enemy').map(f => (
                <motion.div
                  key={f.id}
                  initial={{ y: 0, opacity: 1, scale: 1.3 }}
                  animate={{ y: -50, opacity: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute font-cinzel text-2xl md:text-3xl font-black text-rose-500 drop-shadow-[0_4px_8px_rgba(0,0,0,1)] pointer-events-none"
                >
                  {f.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Player Vital Quick Card on Bottom Left */}
        <div className="relative z-10 w-full max-w-sm bg-slate-950/85 border border-white/10 rounded-2xl p-3 backdrop-blur-md space-y-1.5 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-cinzel font-bold text-slate-100">{character?.name || 'Ksatria'}</span>
            <span className="font-mono text-slate-300 text-[11px]">{playerHp} / {maxPlayerHp} HP</span>
          </div>
          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
              animate={{ width: `${playerHpPercent}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 pt-0.5">
            <span>Mana: {character?.mana || 0} / {character?.maxMana || 15}</span>
            <span className="text-amber-300">{character?.gold || 0} G</span>
          </div>

          {/* Player Status Effect Badges */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {(character?.statusEffects || (playerHpPercent <= 25 ? ['weakened'] : ['blessed'])).map((eff, i) => (
              <StatusEffectBadge key={i} effectId={eff} />
            ))}
          </div>

          {/* Floating Damage on Player */}
          <AnimatePresence>
            {floatingTexts.filter(f => f.target === 'player').map(f => (
              <motion.div
                key={f.id}
                initial={{ y: 0, opacity: 1, scale: 1.2 }}
                animate={{ y: -35, opacity: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute top-0 right-4 font-cinzel text-xl font-black text-rose-500 drop-shadow pointer-events-none"
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: Combat Log & Tactile Commands */}
      <div className="relative flex-[2] xl:flex-[2] h-[48vh] lg:h-full flex flex-col justify-between bg-slate-950/95 border-t lg:border-t-0 lg:border-l border-white/10 p-4 md:p-6 shadow-2xl z-20">
        {/* Combat Event Log */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-2 pb-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-mono text-slate-400">
            <ScrollText className="w-4 h-4 text-amber-400" />
            <span className="uppercase tracking-wider">Catatan Pertempuran Taktis</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-outfit text-xs text-slate-300 leading-relaxed scrollbar-hide">
            {combatLog.map((log, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl border text-xs transition-colors ${
                  i === 0
                    ? 'bg-amber-950/30 border-amber-400/40 text-amber-200 font-medium'
                    : 'bg-slate-900/40 border-white/5 text-slate-400'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Command Menu (Tactile, min 48px touch target) */}
        <div className="pt-3 border-t border-white/10 space-y-2.5">
          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Attack with Animated D20 Roller */}
            <button
              disabled={isLoading || isConcluding || enemyHp <= 0}
              onClick={() => setIsDiceRollerOpen(true)}
              aria-label="Lakukan serangan fisik senjata dengan lemparan dadu D20"
              className="py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-cinzel font-bold text-xs tracking-wider shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px] cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
              <span>Serang (D20)</span>
            </button>

            {/* 2. Spell */}
            <button
              disabled={isLoading || isConcluding || enemyHp <= 0}
              onClick={() => setShowSpellMenu(prev => !prev)}
              aria-label="Pilih mantra sihir arkanum"
              className="py-3 px-3 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-cinzel font-bold text-xs tracking-wider shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sihir Arkanum</span>
            </button>

            {/* 3. Potion */}
            <button
              disabled={isLoading || isConcluding || enemyHp <= 0 || potionCount === 0}
              onClick={() => {
                const potion = (character?.inventory || []).find(i =>
                  i && (i.category === 'Obat' || i.category === 'Potion' || i.category === 'consumable' || String(i.id).includes('potion'))
                );
                if (potion) handleAction('USE_ITEM', potion.id);
              }}
              aria-label={`Gunakan ramuan penyembuh (tersedia ${potionCount})`}
              className="py-3 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-cinzel font-semibold text-xs tracking-wider shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px] cursor-pointer"
            >
              <Heart className="w-4 h-4" />
              <span>Potion ({potionCount})</span>
            </button>

            {/* 4. Flee */}
            <button
              disabled={isLoading || isConcluding || enemyHp <= 0}
              onClick={() => handleAction('FLEE')}
              aria-label="Mencoba kabur meloloskan diri"
              className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-cinzel font-semibold text-xs tracking-wider border border-white/10 shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px] cursor-pointer"
            >
              <Footprints className="w-4 h-4" />
              <span>Taktik Kabur</span>
            </button>
          </div>

          {/* Spell Sub-drawer */}
          {showSpellMenu && (
            <div className="p-3 bg-slate-950 border border-purple-500/40 rounded-xl space-y-2 animate-fadeIn">
              <span className="text-[10px] font-mono text-purple-300 uppercase font-bold block">
                Mantra Tersedia (Biaya: 5 Mana):
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  disabled={isLoading || (character?.mana || 0) < 5}
                  onClick={() => handleAction('CAST_SPELL')}
                  className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 hover:bg-red-900 disabled:opacity-40 text-red-200 text-xs font-medium flex items-center justify-between cursor-pointer min-h-[44px]"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="font-cinzel font-bold">Fireball (2d6 + Stat Mod)</span>
                  </div>
                  <span className="font-mono text-[10px] text-amber-300 font-bold">5 Mana</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animated 3D D20 Dice Roller Modal */}
      <DiceRoller
        isOpen={isDiceRollerOpen}
        onClose={() => setIsDiceRollerOpen(false)}
        targetAc={enemyData.ac || 12}
        statModifier={statMod}
        onRollComplete={handleDiceRollComplete}
      />
    </div>
  );
}
