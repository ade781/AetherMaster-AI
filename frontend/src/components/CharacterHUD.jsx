import React, { useState } from 'react';
import { Heart, Sparkles, Coins, Backpack, X } from 'lucide-react';
import audio from '../services/audioService';
import { calculateMod } from '../utils/rpgMath';

export default function CharacterHUD({ character, onUseItem }) {
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  if (!character) return null;

  const hpPercent = Math.max(0, Math.min(100, Math.round((character.hp / character.maxHp) * 100)));
  const manaPercent = Math.max(0, Math.min(100, Math.round((character.mana / character.maxMana) * 100)));
  const isHpCritical = hpPercent <= 25;

  const inventory = character.inventory || [];
  const slots = Array(6).fill(null);
  inventory.slice(0, 6).forEach((item, idx) => {
    slots[idx] = item;
  });

  const getPortraitSrc = (name) => {
    if (!name) return '/assets/portraits/char_hero_01_paladin.png';
    return `/assets/portraits/${name}.png`;
  };

  const getItemIconSrc = (iconName) => {
    if (!iconName) return '/assets/items/item_01_potion_heal.png';
    return `/assets/items/${iconName}.png`;
  };

  return (
    <>
      {/* Top HUD Bar */}
      <header className="w-full bg-black/20 backdrop-blur-md border-b border-white/5 px-5 py-4 flex flex-col gap-4 select-none">
        {/* Row 1: Identity & Inventory */}
        <div className="flex items-center justify-between">
          {/* Character Identity */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black flex-shrink-0">
              <img
                src={getPortraitSrc(character.avatarUrl)}
                alt={character.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/assets/portraits/char_hero_01_paladin.png'; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel font-bold text-sm md:text-base text-fantasy-gold tracking-wide">
                  {character.name}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium capitalize">
                  Lvl {character.level} {character.characterClass}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 capitalize">
                Ras: {character.race}
              </div>
            </div>
          </div>

          {/* Gold & Inventory */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px] font-bold shadow-sm">
              <Coins className="w-3.5 h-3.5" />
              <span>{character.gold} G</span>
            </div>
            <button
              onClick={() => {
                audio.playClick();
                setShowInventory(!showInventory);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer min-h-[44px]"
              aria-label="Buka Tas Inventaris"
            >
              <Backpack className="w-4 h-4 text-fantasy-gold" />
              <span className="w-5 h-5 rounded-full bg-fantasy-gold/20 text-fantasy-gold flex items-center justify-center text-[10px] font-bold">
                {inventory.length}
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Vital Bars (HP & Mana) */}
        <div className="flex items-center gap-4 w-full">
          {/* Health Bar */}
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="flex items-center gap-1 text-rose-400">
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                HP
              </span>
              <span className="font-mono text-slate-300">
                {character.hp} / {character.maxHp}
              </span>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isHpCritical ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-rose-700 to-rose-400'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Mana Bar */}
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="flex items-center gap-1 text-sky-400">
                <Sparkles className="w-3 h-3 text-sky-400" />
                Aether
              </span>
              <span className="font-mono text-slate-300">
                {character.mana} / {character.maxMana}
              </span>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-700 to-sky-400 transition-all duration-500 rounded-full"
                style={{ width: `${manaPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 6 Attributes Quick Bar */}
      <div className="w-full bg-black/10 px-5 py-2 flex items-center justify-between text-[10px] overflow-hidden select-none border-b border-white/5 opacity-80">
        {[
          { label: 'STR', val: character.str },
          { label: 'DEX', val: character.dex },
          { label: 'CON', val: character.con },
          { label: 'INT', val: character.int },
          { label: 'WIS', val: character.wis },
          { label: 'CHA', val: character.cha }
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center">
            <span className="font-bold text-slate-500">{stat.label}</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-slate-300">{stat.val}</span>
              <span className="font-mono text-amber-500 font-bold text-[9px]">{calculateMod(stat.val)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 6-Slot Grid Inventory Modal */}
      {showInventory && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-fantasy-border bg-slate-950/95 shadow-2xl p-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Backpack className="w-5 h-5 text-fantasy-gold" />
                <h3 className="font-cinzel text-lg font-bold text-fantasy-gold tracking-wide">
                  Tas Petualang (6 Slot)
                </h3>
              </div>
              <button
                onClick={() => setShowInventory(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 6 Slot Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {slots.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (item) {
                      audio.playClick();
                      setSelectedItem(item);
                    }
                  }}
                  className={`aspect-square rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all duration-150 cursor-pointer ${
                    item
                      ? 'border-fantasy-border/80 bg-slate-900/80 hover:border-fantasy-gold hover:bg-slate-800/80 shadow-sm'
                      : 'border-slate-800/60 bg-slate-950/40 border-dashed opacity-50 cursor-default'
                  }`}
                >
                  {item ? (
                    <>
                      <img
                        src={getItemIconSrc(item.icon || item.id)}
                        alt={item.name}
                        className="w-12 h-12 object-contain mb-1 drop-shadow"
                        onError={(e) => { e.target.src = '/assets/items/item_01_potion_heal.png'; }}
                      />
                      <span className="text-[11px] font-medium text-slate-200 line-clamp-1">
                        {item.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-600 font-cinzel">
                      Kosong
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Item Detail */}
            {selectedItem ? (
              <div className="bg-slate-900/90 border border-fantasy-border/60 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-cinzel font-bold text-sm text-fantasy-gold">
                    {selectedItem.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedItem.category || 'Barang'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {selectedItem.effect || 'Sebuah barang misterius yang berharga.'}
                </p>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      if (onUseItem) onUseItem(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-fantasy-gold hover:bg-yellow-400 text-slate-950 text-xs font-bold font-cinzel transition-colors cursor-pointer min-h-[44px]"
                  >
                    Gunakan Barang
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-500">
                Pilih salah satu barang di atas untuk melihat detail.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
