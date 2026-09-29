import React from 'react';
import { resolveBackgroundPath } from './constants';

export default function SceneBackground({ backgroundId, campaign }) {
  const src = resolveBackgroundPath(backgroundId, campaign);

  return (
    <div className="absolute inset-0 z-0">
      <img
        src={src}
        alt="Adventure Scene"
        className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05] transition-all duration-700 scale-[1.02]"
        onError={(e) => {
          if (!e.target.src.endsWith('/assets/backgrounds/bg_01_tavern.png')) {
            e.target.src = '/assets/backgrounds/bg_01_tavern.png';
          }
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
    </div>
  );
}
