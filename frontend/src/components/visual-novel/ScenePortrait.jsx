import React from 'react';
import { resolvePortraitPath } from './constants';

export default function ScenePortrait({ characterId, speaker }) {
  if (!characterId) return null;
  const src = resolvePortraitPath(characterId);
  if (!src) return null;

  return (
    <div className="absolute bottom-4 left-4 md:left-8 z-10 animate-fadeIn pointer-events-auto">
      <div className="w-40 sm:w-48 md:w-56 border-2 border-slate-700/80 bg-slate-950/90 shadow-2xl rounded-lg overflow-hidden backdrop-blur-sm">
        <div className="h-40 sm:h-48 md:h-56 overflow-hidden bg-black/40 flex items-center justify-center">
          <img
            src={src}
            alt={speaker || 'Karakter'}
            className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="bg-slate-900/95 py-1 px-2 text-center font-cinzel text-xs font-bold text-slate-200 border-t border-slate-700/80 tracking-wide truncate">
          {speaker || 'Karakter'}
        </div>
      </div>
    </div>
  );
}
