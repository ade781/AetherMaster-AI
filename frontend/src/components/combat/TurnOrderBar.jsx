import React from 'react';
import { Swords, Shield, Heart, Skull, Zap } from 'lucide-react';
import FantasyAvatar from '../common/FantasyAvatar';
import FantasyBadge from '../common/FantasyBadge';

export default function TurnOrderBar({
  round = 1,
  activeTurn = 'player', // 'player' | 'enemy'
  character,
  enemy
}) {
  const isPlayerTurn = activeTurn === 'player';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-lg text-xs">
      <div className="flex items-center gap-1.5 border-r border-white/10 pr-2.5 font-mono text-[11px] text-slate-400">
        <Swords className="w-3.5 h-3.5 text-amber-400" />
        <span>R{round}</span>
      </div>

      {/* Combatant Strip */}
      <div className="flex items-center gap-2">
        {/* Player Badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all ${
            isPlayerTurn
              ? 'bg-amber-500/20 border border-amber-400/80 text-amber-300 shadow-md ring-2 ring-amber-400/30'
              : 'opacity-50 text-slate-400'
          }`}
        >
          <FantasyAvatar
            avatarId={character?.avatarUrl}
            alt={character?.name || 'Hero'}
            className="w-4 h-4 rounded-full border border-white/20"
          />
          <span className="font-cinzel text-[11px] font-bold truncate max-w-[80px]">
            {character?.name || 'Hero'}
          </span>
          {isPlayerTurn && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </div>

        <span className="text-white/20 text-[10px]">vs</span>

        {/* Enemy Badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all ${
            !isPlayerTurn
              ? 'bg-rose-500/20 border border-rose-500/80 text-rose-300 shadow-md ring-2 ring-rose-500/30'
              : 'opacity-50 text-slate-400'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-rose-950 border border-rose-600/50 flex items-center justify-center text-[10px]">
            <Skull className="w-2.5 h-2.5 text-rose-400" />
          </span>
          <span className="font-cinzel text-[11px] font-bold truncate max-w-[90px]">
            {enemy?.name || 'Musuh'}
          </span>
          {!isPlayerTurn && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          )}
        </div>
      </div>
    </div>
  );
}
