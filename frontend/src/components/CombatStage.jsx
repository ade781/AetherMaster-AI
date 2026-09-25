import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Sparkles,
  Footprints,
  Shield,
  Heart,
  Flame,
  ScrollText
} from 'lucide-react';
import audio from '../services/audioService';

export default function CombatStage({
  character,
  combatState,
  onResolveCombat,
  onFleeCombat
}) {
  // Defensive fallbacks for monster data
  const enemyData = combatState?.enemy || {
    name: 'Tengkorak Penjaga Kuno',
    sprite: 'monster_01_skeleton',
    maxHp: 32,
    hp: 32,
    ac: 13,
    attackBonus: 3,
    damageDice: '1d6+2'
  };

  const [enemyHp, setEnemyHp] = useState(enemyData.hp || enemyData.maxHp || 30);
  const [playerHp, setPlayerHp] = useState(character?.hp || 20);
  const [combatLog, setCombatLog] = useState([
    `Pertarungan dimulai! ${enemyData.name} (AC ${enemyData.ac || 13}) menghadang jalanmu.`
  ]);
  const [round, setRound] = useState(1);
  const [isActing, setIsActing] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]); // [{ id, text, type: 'damage'|'heal', target: 'enemy'|'player' }]
  const [showSpellMenu, setShowSpellMenu] = useState(false);

  const maxEnemyHp = enemyData.maxHp || 30;
  const enemyHpPercent = Math.max(0, Math.min(100, Math.round((enemyHp / maxEnemyHp) * 100)));
  const playerHpPercent = Math.max(0, Math.min(100, Math.round((playerHp / (character?.maxHp || 20)) * 100)));

  // Play epic combat BGM during battle encounter
  useEffect(() => {
    audio.playBGM('combat', 0.26);
    return () => {
      audio.stopBGM();
    };
  }, []);

  const addFloating = (text, type, target) => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, text, type, target }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(f => f.id !== id));
    }, 1200);
  };

  const addLog = (msg) => {
    setCombatLog(prev => [msg, ...prev.slice(0, 15)]);
  };

  const getMonsterSrc = (spriteName) => {
    if (!spriteName) return '/assets/monsters/monster_01_skeleton.png';
    if (spriteName.startsWith('/') || spriteName.startsWith('http')) return spriteName;
    return `/assets/monsters/${spriteName}.png`;
  };

  // Player Attack Action
  const handleAttack = () => {
    if (isActing || enemyHp <= 0) return;
    setIsActing(true);
    audio.playSwordClash();

    // D20 Roll
    const roll = Math.floor(Math.random() * 20) + 1;
    const strMod = Math.floor(((character?.str || 10) - 10) / 2);
    const attackTotal = roll + strMod;
    const isHit = roll === 20 || attackTotal >= (enemyData.ac || 13);

    if (isHit) {
      const isCrit = roll === 20;
      const baseDmg = Math.floor(Math.random() * 8) + 1 + Math.max(1, strMod);
      const dmg = isCrit ? baseDmg * 2 : baseDmg;
      const newEnemyHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newEnemyHp);
      addFloating(`-${dmg}`, 'damage', 'enemy');
      addLog(`⚔️ Ronde ${round}: ${isCrit ? 'CRITICAL HIT! Tebasan mematikan menembus zirah lawan' : 'Serangan telak mendarat'} (${roll} + ${strMod} = ${attackTotal} vs AC ${enemyData.ac || 13}), menorehkan ${dmg} damage!`);

      if (newEnemyHp <= 0) {
        audio.playCriticalSuccess();
        addLog(`🏆 Kemenangan mutlak! Tubuh ${enemyData.name} ambruk binasa tak bernyawa.`);
        setTimeout(() => {
          onResolveCombat?.({ victory: true, enemyHp: 0, playerHp });
        }, 1800);
        return;
      }
    } else {
      addFloating('LUPUT!', 'miss', 'enemy');
      addLog(`💨 Ronde ${round}: Ayunan senjatamu (${roll} + ${strMod} = ${attackTotal}) meleset tipis dari celah zirah ${enemyData.name}.`);
    }

    // Enemy Counter-attack after short delay
    setTimeout(() => {
      handleEnemyTurn();
    }, 900);
  };

  // Cast Spell
  const handleCastSpell = (spell) => {
    if (isActing || enemyHp <= 0) return;
    setShowSpellMenu(false);
    setIsActing(true);

    if (spell.id === 'fireball') {
      audio.playDiceRoll();
      const dmg = Math.floor(Math.random() * 12) + 6;
      const newEnemyHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newEnemyHp);
      addFloating(`-${dmg}`, 'damage', 'enemy');
      addLog(`🔥 Ronde ${round}: Mantra Fireball membuncah! Kobaran api arkanum melalap ${enemyData.name} sebesar ${dmg} damage api!`);

      if (newEnemyHp <= 0) {
        audio.playCriticalSuccess();
        addLog(`🏆 Tubuh ${enemyData.name} hangus terbakar menjadi abu! Pertarungan usai.`);
        setTimeout(() => {
          onResolveCombat?.({ victory: true, enemyHp: 0, playerHp });
        }, 1800);
        return;
      }
    } else if (spell.id === 'heal') {
      audio.playHeal();
      const healAmt = Math.floor(Math.random() * 10) + 6;
      const newHp = Math.min(character?.maxHp || 25, playerHp + healAmt);
      setPlayerHp(newHp);
      addFloating(`+${healAmt}`, 'heal', 'player');
      addLog(`✨ Ronde ${round}: Cahaya pemulihan Holy Heal terpancar! Memulihkan ${healAmt} HP ragamu.`);
    }

    setTimeout(() => {
      handleEnemyTurn();
    }, 900);
  };

  // Enemy Turn
  const handleEnemyTurn = () => {
    const enemyRoll = Math.floor(Math.random() * 20) + 1;
    const enemyAtk = enemyRoll + (enemyData.attackBonus || 2);
    const playerAc = character?.armorClass || 14;

    if (enemyRoll === 20 || enemyAtk >= playerAc) {
      audio.playSwordClash();
      const dmg = Math.floor(Math.random() * 6) + 2;
      const newHp = Math.max(0, playerHp - dmg);
      setPlayerHp(newHp);
      addFloating(`-${dmg}`, 'damage', 'player');
      addLog(`🩸 Ronde ${round}: ${enemyData.name} menerjang ganas (${enemyRoll} + ${enemyData.attackBonus || 2} = ${enemyAtk} vs AC ${playerAc})! Kamu terhantam ${dmg} damage.`);

      if (newHp <= 0) {
        audio.playCriticalFailure();
        addLog(`💀 Karaktermu tumbang tak berdaya menahan serangan maut ${enemyData.name}...`);
        setTimeout(() => {
          onResolveCombat?.({ victory: false, playerHp: 0 });
        }, 1800);
        return;
      }
    } else {
      addFloating('TANGKIS!', 'miss', 'player');
      addLog(`🛡️ Ronde ${round}: Tangkisan tangguh! Kamu berhasil menepis serangan ${enemyData.name} (${enemyRoll} + ${enemyData.attackBonus || 2} = ${enemyAtk} vs AC ${playerAc})!`);
    }

    setRound(r => r + 1);
    setIsActing(false);
  };

  // Flee
  const handleFlee = () => {
    if (isActing) return;
    setIsActing(true);
    const dexRoll = Math.floor(Math.random() * 20) + 1;
    const dexMod = Math.floor(((character?.dex || 10) - 10) / 2);
    const total = dexRoll + dexMod;

    if (total >= 12) {
      audio.playSelect();
      addLog(`💨 Kamu berhasil meloloskan diri dari pertempuran (DEX Roll: ${total} vs DC 12)!`);
      setTimeout(() => {
        onFleeCombat?.();
      }, 1200);
    } else {
      audio.playClick();
      addLog(`❌ Gagal kabur (DEX Roll: ${total} vs DC 12)! Musuh menghalangi jalan.`);
      setTimeout(() => {
        handleEnemyTurn();
      }, 800);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col lg:flex-row bg-slate-950 overflow-hidden select-none">
      {/* LEFT: Combat Arena */}
      <div className="relative flex-[3] xl:flex-[4] h-[55vh] lg:h-full flex flex-col justify-between p-6 overflow-hidden">
        {/* Arena Background */}
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.4] contrast-125 z-0"
          style={{ backgroundImage: "url('/assets/backgrounds/bg_04_crimson_crypt.png')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80" />
        </div>

        {/* Top Encounter Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-cinzel font-bold shadow-lg">
            <Swords className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Pertempuran Taktis D&amp;D 5E • Ronde {round}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Target AC: {enemyData.ac || 13}</span>
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
                  className={`absolute font-cinzel text-2xl md:text-3xl font-black drop-shadow-[0_4px_8px_rgba(0,0,0,1)] ${f.type === 'damage' ? 'text-rose-500' : 'text-slate-300'
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
            <span className="font-mono text-slate-300">{playerHp} / {character?.maxHp || 20} HP</span>
          </div>
          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              animate={{ width: `${playerHpPercent}%` }}
              transition={{ duration: 0.3 }}
            />
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
                className={`absolute top-0 right-4 font-cinzel text-xl font-black drop-shadow ${f.type === 'heal' ? 'text-emerald-400' : 'text-rose-500'
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
            <span>Catatan Pertempuran (Combat Log)</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-outfit text-xs text-slate-300 leading-relaxed scrollbar-hide">
            {combatLog.map((log, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl border ${i === 0
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
              disabled={isActing || enemyHp <= 0}
              onClick={handleAttack}
              className="py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-cinzel font-bold text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Swords className="w-4 h-4" />
              <span>Serang (D20)</span>
            </button>

            <button
              disabled={isActing || enemyHp <= 0}
              onClick={() => setShowSpellMenu(prev => !prev)}
              className="py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-cinzel font-bold text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mantra</span>
            </button>

            <button
              disabled={isActing || enemyHp <= 0}
              onClick={() => handleCastSpell({ id: 'heal' })}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-cinzel font-semibold text-xs tracking-wider shadow flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Heart className="w-4 h-4" />
              <span>Holy Heal</span>
            </button>

            <button
              disabled={isActing || enemyHp <= 0}
              onClick={handleFlee}
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
                Pilih Mantra Magis:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCastSpell({ id: 'fireball' })}
                  className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 hover:bg-red-900 text-red-200 text-xs font-medium flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fireball (1d12+6)</span>
                </button>
                <button
                  onClick={() => handleCastSpell({ id: 'heal' })}
                  className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-200 text-xs font-medium flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Holy Heal (1d10+6)</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
