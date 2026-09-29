import React from 'react';
import { motion } from 'framer-motion';
import { resolvePortraitPath } from './constants';

export default function ScenePortrait({ characterId, speaker }) {
  if (!characterId) return null;
  const src = resolvePortraitPath(characterId);
  if (!src) return null;

  const isSpeaking = Boolean(speaker && speaker !== 'Dungeon Master' && speaker !== 'Narator');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="absolute bottom-0 left-4 md:left-10 z-10 pointer-events-none select-none flex flex-col items-center"
    >
      <div className="relative w-36 sm:w-44 md:w-52 lg:w-56 overflow-hidden">
        {/* Subtle Speaker Glow Highlight when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl -z-10 pointer-events-none animate-pulse" />
        )}

        {/* Character Portrait with natural bottom fade gradient into scene */}
        <motion.img
          src={src}
          alt={speaker || 'Karakter'}
          animate={isSpeaking ? { scale: 1.015 } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`w-full max-h-[46vh] object-contain object-bottom filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] ${
            isSpeaking ? 'brightness-105' : 'brightness-95 opacity-90'
          }`}
          style={{
            maskImage: 'linear-gradient(to top, transparent 0%, black 18%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 18%, black 100%)'
          }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />

        {/* Subtle Organic Nameplate floating above bottom fade */}
        <div className="relative -mt-3 pb-2 text-center">
          <span className={`inline-block font-cinzel text-[11px] font-bold px-3 py-0.5 rounded-full border backdrop-blur-md shadow-md transition-all ${
            isSpeaking
              ? 'bg-slate-950/85 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/20'
              : 'bg-slate-950/60 text-slate-300 border-white/10'
          }`}>
            {speaker || 'Karakter'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
