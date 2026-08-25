import React, { useState } from 'react';
import { Map, MapPin, Compass, Eye, Lock, Sparkles, Play } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

const MAP_LOCATIONS = [
  {
    id: 'loc_eldoria',
    name: 'Makam Kuno Eldoria',
    type: 'Dungeon Kuno',
    coords: { x: 30, y: 35 },
    unlocked: true,
    desc: 'Pintu gerbang bawah tanah peninggalan dinasti kuno yang terkutuk.',
  },
  {
    id: 'loc_frostpeak',
    name: 'Puncak Gunung Frostpeak',
    type: 'Sarang Naga',
    coords: { x: 75, y: 20 },
    unlocked: true,
    desc: 'Puncak bersalju abadi tempat naga wyrm merah beristirahat.',
  },
  {
    id: 'loc_shadowfen',
    name: 'Rimba Magis Shadowfen',
    type: 'Hutan Arcane',
    coords: { x: 45, y: 70 },
    unlocked: true,
    desc: 'Hutan berkabut tebal dengan kristal mana bercahaya ungu.',
  },
  {
    id: 'loc_oakhaven',
    name: 'Kota Kerajaan Oakhaven',
    type: 'Ibukota & Pasar',
    coords: { x: 60, y: 55 },
    unlocked: true,
    desc: 'Kota benteng megah pusat perdagangan dan intrik kekaisaran.',
  },
  {
    id: 'loc_forbidden_swamp',
    name: 'Rawa Terlarang (Terkunci)',
    type: 'Zona Gelap',
    coords: { x: 80, y: 75 },
    unlocked: false,
    desc: 'Area penuh kabut misterius yang belum pernah dipetakan.',
  },
];

export const WorldMapExplorer = ({ onTravelLocation }) => {
  const [selectedLoc, setSelectedLoc] = useState(MAP_LOCATIONS[0]);

  const handleSelectLocation = (loc) => {
    setSelectedLoc(loc);
    audioEngine.playDiceRoll();
  };

  const handleStartTravel = (loc) => {
    audioEngine.playSwordClash();
    if (onTravelLocation) {
      onTravelLocation(loc);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-cinzel text-fantasy-gold text-2xl font-bold tracking-wide flex items-center gap-2">
            <Map size={24} /> Peta Benua Aetheria (World Explorer)
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Jelajahi wilayah tak bertuan, buka area berkabut (Fog of War), dan pilih tujuan ekspedisi
          </p>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map Board */}
        <div className="lg:col-span-2 relative bg-slate-950 rounded-2xl overflow-hidden border-2 border-fantasy-border h-[420px] shadow-2xl p-4 flex items-center justify-center">
          {/* Map Cartography Texture Background */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 filter contrast-125"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(142, 68, 173, 0.15) 0%, transparent 60%), radial-gradient(circle, rgba(230, 195, 92, 0.15) 100%, transparent 40%)`
            }}
          />

          {/* Grid coordinates SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e6c35c" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Location Nodes */}
          {MAP_LOCATIONS.map((loc) => (
            <div
              key={loc.id}
              onClick={() => handleSelectLocation(loc)}
              style={{ left: `${loc.coords.x}%`, top: `${loc.coords.y}%` }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-20 group ${
                loc.unlocked ? 'hover:scale-125' : 'opacity-60'
              }`}
            >
              <div className={`p-2.5 rounded-full border-2 shadow-xl flex items-center justify-center transition-all ${
                selectedLoc?.id === loc.id
                  ? 'bg-fantasy-gold text-slate-950 border-white ring-4 ring-fantasy-gold/50 scale-125 animate-bounce'
                  : loc.unlocked
                  ? 'bg-slate-900 text-fantasy-gold border-fantasy-gold/70 hover:border-fantasy-gold'
                  : 'bg-slate-950 text-slate-500 border-slate-700'
              }`}>
                {loc.unlocked ? <MapPin size={16} /> : <Lock size={14} />}
              </div>

              {/* Node Title Tooltip */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 whitespace-nowrap bg-slate-950/90 text-slate-200 text-[10px] font-bold font-cinzel px-2.5 py-1 rounded-md border border-slate-700 shadow-lg pointer-events-none group-hover:border-fantasy-gold">
                {loc.name}
              </div>
            </div>
          ))}

          {/* Fog of War Overlay */}
          <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-sm border border-slate-700 p-2.5 rounded-xl text-[11px] text-slate-400 z-30">
            ☁️ <strong>Fog of War:</strong> Sebagian wilayah timur masih berkabut tebal.
          </div>
        </div>

        {/* Selected Location Info Card */}
        <div className="glass-card rounded-2xl p-6 border border-fantasy-border shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] bg-amber-950/80 text-fantasy-gold font-bold px-2.5 py-0.5 rounded border border-fantasy-gold/30">
                {selectedLoc.type}
              </span>
              {!selectedLoc.unlocked && (
                <span className="text-[10px] bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                  Belum Terjamah
                </span>
              )}
            </div>

            <h3 className="font-cinzel text-fantasy-gold text-xl font-bold mt-1">
              {selectedLoc.name}
            </h3>

            <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed">
              {selectedLoc.desc}
            </p>

            <div className="mt-4 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Status Keamanan:</span>
                <span className="text-amber-400 font-semibold">Tinggi Bahaya (CR 2)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jarak Tempuh:</span>
                <span className="text-emerald-400 font-semibold">1 Hari Perjalanan Kuda</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleStartTravel(selectedLoc)}
            disabled={!selectedLoc.unlocked}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-gold-glow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Compass size={16} /> Berangkat ke Wilayah Ini
          </button>
        </div>
      </div>
    </div>
  );
};
