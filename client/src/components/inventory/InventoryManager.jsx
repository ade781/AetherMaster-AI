import React, { useState } from 'react';
import { Package, Search, Shield, Sword, Heart, Sparkles, Plus } from 'lucide-react';

export const InventoryManager = ({ inventory = [], onEquipItem, gold = 0 }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const categories = [
    { id: 'all', label: 'Semua' },
    { id: 'weapon', label: 'Senjata' },
    { id: 'armor', label: 'Zirah & Perisai' },
    { id: 'consumable', label: 'Ramuan' },
    { id: 'item', label: 'Barang' },
  ];

  const filteredItems = inventory.filter((item) => {
    const matchesCat = filter === 'all' || item.type === filter || (filter === 'armor' && (item.type === 'shield' || item.type === 'helmet' || item.type === 'ring' || item.type === 'boots'));
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalWeight = inventory.reduce((sum, item) => sum + ((item.weight || 1) * (item.quantity || 1)), 0);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5">
            <Package size={16} /> Tas Inventaris & Harta
          </h4>
          <span className="bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700 text-[10px] text-slate-400">
            Beban: {totalWeight.toFixed(1)} / 150 lbs
          </span>
        </div>

        <div className="text-xs font-semibold text-fantasy-gold">
          💰 {gold} Koin Emas
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === c.id
                  ? 'bg-fantasy-gold text-slate-950 font-bold'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[120px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari item..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
          />
        </div>
      </div>

      {/* Inventory Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-slate-500 italic">
            Tidak ada item di dalam kategori ini.
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <div
              key={idx}
              draggable={!!item.slot}
              onDragStart={(e) => handleDragStart(e, item)}
              className={`bg-slate-900/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex justify-between items-center ${
                item.slot ? 'cursor-grab active:cursor-grabbing hover:border-fantasy-gold/50' : ''
              }`}
              title={item.slot ? 'Drag item ini ke slot perlengkapan tempur' : item.desc}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-xs font-semibold text-slate-200 truncate">{item.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {item.damage || (item.acBonus ? `+${item.acBonus} AC` : item.desc?.slice(0, 32) + '...')}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {item.slot && (
                  <button
                    type="button"
                    onClick={() => onEquipItem(item, item.slot, 'equip')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-fantasy-gold px-2 py-1 rounded border border-fantasy-gold/30"
                  >
                    Pasang
                  </button>
                )}
                {item.type === 'consumable' && (
                  <span className="text-[10px] bg-rose-950/60 text-rose-300 px-2 py-1 rounded border border-rose-800">
                    Ramuan
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
