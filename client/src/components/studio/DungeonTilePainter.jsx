import React, { useState } from 'react';
import { LayoutGrid, Paintbrush, Trash2 } from 'lucide-react';

const TILE_TYPES = {
  floor: { id: 'floor', name: 'Lantai Batu', color: '#1e293b', icon: '🪨' },
  wall: { id: 'wall', name: 'Dinding Batu', color: '#0f172a', icon: '🧱' },
  door: { id: 'door', name: 'Pintu Kayu', color: '#92400e', icon: '🚪' },
  chest: { id: 'chest', name: 'Peti Harta', color: '#b45309', icon: '📦' },
  trap: { id: 'trap', name: 'Lantai Jebakan', color: '#991b1b', icon: '⚠️' },
};

const GRID_DIM = 8;

export const DungeonTilePainter = ({ mapLayout = [], onChangeMapLayout }) => {
  const [activeBrush, setActiveBrush] = useState('wall');
  const [grid, setGrid] = useState(() => {
    if (mapLayout && mapLayout.length === GRID_DIM * GRID_DIM) {
      return mapLayout;
    }
    // Default room with surrounding walls
    const initial = [];
    for (let y = 0; y < GRID_DIM; y++) {
      for (let x = 0; x < GRID_DIM; x++) {
        if (x === 0 || x === GRID_DIM - 1 || y === 0 || y === GRID_DIM - 1) {
          initial.push(x === 4 && y === GRID_DIM - 1 ? 'door' : 'wall');
        } else if (x === 4 && y === 2) {
          initial.push('chest');
        } else {
          initial.push('floor');
        }
      }
    }
    return initial;
  });

  const handleTileClick = (index) => {
    const updated = [...grid];
    updated[index] = activeBrush;
    setGrid(updated);
    onChangeMapLayout(updated);
  };

  const handleClearAll = () => {
    const empty = Array(GRID_DIM * GRID_DIM).fill('floor');
    setGrid(empty);
    onChangeMapLayout(empty);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tile Paint Board (8x8) */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-fantasy-border space-y-4 flex flex-col items-center">
        <div className="w-full flex justify-between items-center pb-2 border-b border-slate-800">
          <div>
            <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5">
              <LayoutGrid size={16} /> Pelukis Peta Ruangan Dungeon (8x8)
            </h4>
            <span className="text-[10px] text-slate-400">Klik petak untuk meletakkan elemen dungeon</span>
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <Trash2 size={13} /> Bersihkan Peta
          </button>
        </div>

        {/* 8x8 Grid Canvas */}
        <div
          className="grid gap-1 bg-slate-950 p-3 rounded-2xl border-2 border-fantasy-border shadow-2xl mt-2 select-none"
          style={{
            gridTemplateColumns: `repeat(${GRID_DIM}, minmax(0, 1fr))`,
            width: '100%',
            maxWidth: '420px',
            aspectRatio: '1/1',
          }}
        >
          {grid.map((tileType, idx) => {
            const tile = TILE_TYPES[tileType] || TILE_TYPES.floor;
            return (
              <div
                key={idx}
                onClick={() => handleTileClick(idx)}
                style={{ backgroundColor: tile.color }}
                className="rounded-lg border border-slate-800/80 hover:border-fantasy-gold flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                title={`${tile.name} (Petak ${idx + 1})`}
              >
                <span className="text-sm">{tile.icon}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Palette Tools */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
        <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5 pb-2 border-b border-slate-800">
          <Paintbrush size={15} /> Palet Kuas Elemen
        </h4>

        <div className="space-y-2">
          {Object.values(TILE_TYPES).map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => setActiveBrush(tile.id)}
              className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                activeBrush === tile.id
                  ? 'bg-amber-950/50 border-fantasy-gold shadow-gold-glow text-fantasy-gold font-bold'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{tile.icon}</span>
                <span className="text-xs">{tile.name}</span>
              </div>
              <div
                className="w-4 h-4 rounded-full border border-white/40"
                style={{ backgroundColor: tile.color }}
              />
            </button>
          ))}
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div>💡 <strong>Tips Kreator:</strong></div>
          <p>Tata letak peta ini akan otomatis digunakan saat pemain memasuki mode pertempuran taktis.</p>
        </div>
      </div>
    </div>
  );
};
