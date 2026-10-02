import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Sparkles, AlertTriangle, Shield, Swords, Check, X } from 'lucide-react';
import audio from '../../services/audioService';

export default function DiceRoller({
  isOpen,
  onClose,
  targetAc = 12,
  statModifier = 3,
  attackType = 'MELEE',
  onRollComplete
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState(20);
  const [finalRoll, setFinalRoll] = useState(null);
  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const [isCriticalMiss, setIsCriticalMiss] = useState(false);

  useEffect(() => {
    if (isOpen) {
      triggerRoll();
    }
  }, [isOpen]);

  const triggerRoll = () => {
    setIsRolling(true);
    setFinalRoll(null);
    setIsCriticalHit(false);
    setIsCriticalMiss(false);

    audio.playDiceRoll();

    // Rapid number cycling for tactile feedback
    let counter = 0;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 20) + 1);
      counter++;
      if (counter > 12) {
        clearInterval(interval);
        // Determine final result (1 to 20)
        const roll = Math.floor(Math.random() * 20) + 1;
        setDisplayValue(roll);
        setFinalRoll(roll);
        setIsRolling(false);

        const isCrit20 = roll === 20;
        const isFumble1 = roll === 1;

        if (isCrit20) {
          setIsCriticalHit(true);
          audio.playCriticalHit();
        } else if (isFumble1) {
          setIsCriticalMiss(true);
          audio.playCriticalMiss();
        } else {
          audio.playSelect();
        }

        const totalAttack = roll + statModifier;
        const isHit = isCrit20 || (!isFumble1 && totalAttack >= targetAc);

        setTimeout(() => {
          onRollComplete?.({
            roll,
            statModifier,
            totalAttack,
            targetAc,
            isHit,
            isCriticalHit: isCrit20,
            isCriticalMiss: isFumble1
          });
        }, 1300);
      }
    }, 50);
  };

  if (!isOpen) return null;

  const total = (finalRoll ?? displayValue) + statModifier;
  const isHit = isCriticalHit || (!isCriticalMiss && total >= targetAc);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      {/* Container with optional screen shake on Natural 20 */}
      <motion.div
        animate={
          isCriticalHit
            ? { x: [-8, 8, -6, 6, -2, 2, 0], y: [-4, 4, -2, 2, 0] }
            : {}
        }
        transition={{ duration: 0.4 }}
        className={`relative w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl backdrop-blur-xl border transition-all ${
          isCriticalHit
            ? 'bg-gradient-to-b from-amber-950/90 to-slate-950/95 border-amber-400 shadow-amber-500/30'
            : isCriticalMiss
            ? 'bg-gradient-to-b from-rose-950/90 to-slate-950/95 border-rose-500 shadow-rose-500/30'
            : 'bg-slate-950/95 border-white/10'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Dices className={`w-5 h-5 ${isCriticalHit ? 'text-amber-400' : isCriticalMiss ? 'text-rose-400' : 'text-slate-400'}`} />
          <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
            Lemparan Dadu D20 (Serangan Taktis)
          </h3>
        </div>

        {/* 3D-styled Polyhedral D20 Display */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Aura Rings */}
          <div
            className={`absolute w-36 h-36 rounded-full blur-2xl transition-all ${
              isCriticalHit
                ? 'bg-amber-400/40 animate-pulse'
                : isCriticalMiss
                ? 'bg-rose-600/40'
                : 'bg-cyan-500/10'
            }`}
          />

          {/* D20 Hexagon / Icosahedron Avatar */}
          <motion.div
            animate={
              isRolling
                ? { rotate: [0, 90, 180, 270, 360], scale: [0.9, 1.1, 0.95, 1] }
                : { rotate: 0, scale: 1 }
            }
            transition={{ repeat: isRolling ? Infinity : 0, duration: 0.6 }}
            className={`relative w-28 h-28 rounded-2xl flex items-center justify-center border-2 shadow-2xl transition-colors ${
              isCriticalHit
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-slate-950 shadow-amber-400/50'
                : isCriticalMiss
                ? 'bg-gradient-to-br from-rose-700 to-rose-950 border-rose-400 text-rose-100 shadow-rose-600/50'
                : 'bg-gradient-to-br from-slate-900 to-slate-950 border-cyan-400/40 text-cyan-200'
            }`}
          >
            <span className="font-cinzel text-4xl sm:text-5xl font-black drop-shadow-md">
              {displayValue}
            </span>
          </motion.div>
        </div>

        {/* Result Callout Banner */}
        <div className="space-y-2 min-h-[64px]">
          {isRolling ? (
            <p className="text-xs font-mono text-slate-400 animate-pulse">
              Mengocok takdir di atas meja...
            </p>
          ) : isCriticalHit ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-1"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 font-cinzel text-xs font-bold shadow-lg">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>NATURAL 20 — CRITICAL HIT!</span>
              </div>
              <p className="text-[11px] text-amber-200/90 font-sans">
                Serangan telak mematikan! Kerusakan dilipatgandakan secara otomatis.
              </p>
            </motion.div>
          ) : isCriticalMiss ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-1"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500 text-rose-300 font-cinzel text-xs font-bold shadow-lg">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>NATURAL 1 — CRITICAL MISS / FUMBLE!</span>
              </div>
              <p className="text-[11px] text-rose-300/90 font-sans">
                Serangan meleset total tanpa peduli modifikator stat.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 font-mono text-xs text-slate-300">
                <span>D20 ({finalRoll})</span>
                <span>+</span>
                <span>Stat ({statModifier >= 0 ? `+${statModifier}` : statModifier})</span>
                <span>=</span>
                <span className="font-bold text-amber-300 text-sm">{total}</span>
                <span className="text-slate-500">vs AC {targetAc}</span>
              </div>
              <div className={`text-xs font-bold font-cinzel ${isHit ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isHit ? '✓ SERANGAN MENEMBUS PERTAHANAN (HIT)' : '✗ SERANGAN MELENCENG (MISS)'}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Target AC: {targetAc}</span>
          <span>Modifikator: {statModifier >= 0 ? `+${statModifier}` : statModifier}</span>
        </div>
      </motion.div>
    </div>
  );
}
