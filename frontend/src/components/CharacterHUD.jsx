import React, { useState } from 'react';
import { Heart, Sparkles, Coins, Backpack, X, Shield } from 'lucide-react';
import audio from '../services/audioService';
import { calculateMod } from '../utils/rpgMath';
import FantasyAvatar from './common/FantasyAvatar';
import ItemSlot from './common/ItemSlot';

export default function CharacterHUD({
  character,
  onUseItem,
  isInventoryOpen: propInventoryOpen,
  onToggleInventory
}) {
  const [localInventoryOpen, setLocalInventoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  if (!character) return null;

  const showInventory = propInventoryOpen !== undefined ? propInventoryOpen : localInventoryOpen;
  const setShowInventory = (val) => {
    if (onToggleInventory) {
      onToggleInventory(val);
    } else {
      setLocalInventoryOpen(val);
    }
  };

  const hpPercent = Math.max(0, Math.min(100, Math.round((character.hp / (character.maxHp || 1)) * 100)));
  const manaPercent = Math.max(0, Math.min(100, Math.round((character.mana / (character.maxMana || 1)) * 100)));
  const isHpCritical = hpPercent <= 20;

  const inventory = character.inventory || [];
  const slots = Array(6).fill(null);
  inventory.slice(0, 6).forEach((item, idx) => {
    slots[idx] = item;
  });

  return (
    <>
      {/* Top HUD Bar */}
      <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 md:px-5 py-3 md:py-4 flex flex-col gap-3 select-none">
        {/* Row 1: Identity & Inventory */}
        <div className="flex items-center justify-between gap-2">
          {/* Character Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <FantasyAvatar
              avatarId={character.avatarUrl}
              alt={character.name}
              className="w-11 h-11 md:w-12 md:h-12 flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel font-bold text-sm md:text-base text-amber-300 tracking-wide truncate">
                  {character.name}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium capitalize shrink-0">
                  Lvl {character.level || 1} {character.characterClass}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 capitalize flex items-center gap-2 truncate">
                <span>Ras: {character.race}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Shield className="w-3 h-3 text-amber-400" />
                  AC {character.armorClass || 14}
                </span>
              </div>
            </div>
          </div>

          {/* Gold & Inventory (Touch Target min 44px) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px] font-bold shadow-sm">
              <Coins className="w-3.5 h-3.5" />
              <span>{character.gold ?? 50} G</span>
            </div>
            <button
              onClick={() => {
                audio.playClick();
                setShowInventory(!showInventory);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer min-h-[44px]"
              aria-label="Buka Tas Inventaris (Hotkey: I)"
              title="Buka Tas Inventaris (Hotkey: I)"
            >
              <Backpack className="w-4 h-4 text-amber-400" />
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
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
                <Heart className={`w-3 h-3 fill-rose-500 text-rose-500 ${isHpCritical ? 'animate-ping' : ''}`} />
                HP {isHpCritical && <span className="text-[9px] uppercase font-bold text-rose-300">(KRITIS!)</span>}
              </span>
              <span className="font-mono text-slate-300 text-[10px]">
                {character.hp} / {character.maxHp}
              </span>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
              <div
                className={`h-full transition-all duration-500 rounded-full ${isHpCritical ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-rose-700 to-rose-400'
                  }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Mana / Aether Bar */}
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="flex items-center gap-1 text-sky-400">
                <Sparkles className="w-3 h-3 text-sky-400" />
                Aether
              </span>
              <span className="font-mono text-slate-300 text-[10px]">
                {character.mana ?? 10} / {character.maxMana ?? 10}
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
      <div className="w-full bg-black/20 px-4 md:px-5 py-2 flex items-center justify-between text-[10px] overflow-hidden select-none border-b border-white/5 opacity-85">
        {[
          { label: 'STR', val: character.str ?? 10 },
          { label: 'DEX', val: character.dex ?? 10 },
          { label: 'CON', val: character.con ?? 10 },
          { label: 'INT', val: character.int ?? 10 },
          { label: 'WIS', val: character.wis ?? 10 },
          { label: 'CHA', val: character.cha ?? 10 }
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center">
            <span className="font-bold text-slate-500">{stat.label}</span>
            <div className="flex items-baseline gap-0.5">
              <span className="font-mono text-slate-300">{stat.val}</span>
              <span className="font-mono text-amber-400 font-bold text-[9px]">{calculateMod(stat.val)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 6-Slot Grid Inventory Modal / Drawer */}
      {showInventory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setShowInventory(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950/95 shadow-2xl p-5 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Backpack className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel text-lg font-bold text-amber-300 tracking-wide">
                  Tas Petualang (6 Slot)
                </h3>
              </div>
              <button
                onClick={() => setShowInventory(false)}
                className="w-10 h-10 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
                aria-label="Tutup Tas"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 6 Slot Grid with unified ItemSlot component */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {slots.map((item, idx) => (
                <ItemSlot
                  key={idx}
                  item={item}
                  idx={idx}
                  isSelected={selectedItem?.id === item?.id}
                  onClick={() => {
                    if (item) {
                      audio.playClick();
                      setSelectedItem(item);
                    }
                  }}
                />
              ))}
            </div>

            {/* Selected Item Detail */}
            {selectedItem ? (
              <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="font-cinzel font-bold text-sm text-amber-300">
                    {selectedItem.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedItem.category || 'Barang'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedItem.effect || 'Sebuah barang petualangan yang berguna.'}
                </p>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      if (onUseItem) onUseItem(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold font-cinzel transition-all cursor-pointer min-h-[44px]"
                  >
                    Gunakan Barang
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-500">
                Pilih salah satu barang di atas untuk melihat detail (Hotkey: I untuk tutup).
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
