import React from 'react';
import { WeatherCanvas } from '../vfx/WeatherCanvas';
import { Compass, Sparkles, MapPin } from 'lucide-react';

const SCENE_PRESETS = {
  dungeon: {
    name: 'Ruang Bawah Tanah Kuno',
    bg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    weather: 'embers',
    mood: 'Tegang & Misterius',
  },
  mountain: {
    name: 'Lereng Gunung Beku',
    bg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
    weather: 'snow',
    mood: 'Badai Salju Dingin',
  },
  forest: {
    name: 'Rimba Terlarang Shadowfen',
    bg: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=1200&auto=format&fit=crop&q=80',
    weather: 'embers',
    mood: 'Sihir Mistis Ungu',
  },
  tavern: {
    name: 'Kedai Hangat Red Boar',
    bg: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200&auto=format&fit=crop&q=80',
    weather: 'rain',
    mood: 'Ramai & Penuh Intrik',
  },
};

export const VisualNovelStage = ({ story, currentScene = 'dungeon', character }) => {
  const scene = SCENE_PRESETS[currentScene] || SCENE_PRESETS.dungeon;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-fantasy-border h-64 sm:h-72 w-full shadow-2xl group">
      {/* Background Image Scenery */}
      <img
        src={story?.cover || scene.bg}
        alt={scene.name}
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-75"
      />

      {/* Atmospheric Canvas Weather VFX */}
      <WeatherCanvas weather={scene.weather} />

      {/* Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/70 pointer-events-none" />

      {/* Top Scene Badges */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
        <span className="bg-slate-950/80 backdrop-blur-md text-fantasy-gold text-xs font-cinzel font-bold px-3 py-1.5 rounded-xl border border-fantasy-gold/40 flex items-center gap-1.5 shadow-md">
          <MapPin size={13} /> {scene.name}
        </span>
        <span className="bg-slate-950/80 backdrop-blur-md text-slate-300 text-xs px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-1.5">
          <Sparkles size={12} className="text-fantasy-gold" /> Suasana: {scene.mood}
        </span>
      </div>

      {/* Bottom Stage Character Anchor */}
      {character && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
          <img
            src={character.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${character.name}`}
            alt={character.name}
            className="w-12 h-12 rounded-xl border-2 border-fantasy-gold bg-slate-900 shadow-xl object-cover"
          />
          <div>
            <div className="text-sm font-cinzel font-bold text-slate-100 drop-shadow-md">
              {character.name}
            </div>
            <div className="text-[11px] text-amber-300 font-medium drop-shadow-sm">
              Tingkat {character.level} {character.race} {character.characterClass}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
