import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Coins, Backpack, X, Shield, CheckCircle2 } from 'lucide-react';
import audio from '../services/audioService';
import { calculateMod } from '../utils/rpgMath';
import FantasyAvatar from './common/FantasyAvatar';
import ItemSlot from './common/ItemSlot';
import DirectorTensionBadge from './hud/DirectorTensionBadge';
import AutosaveBadge from './hud/AutosaveBadge';
import { useGameStore } from '../store/GameContext';

export default function CharacterHUD({
  character,
  onUseItem,
  isInventoryOpen = false,
  onToggleInventory
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  let saveStatus = 'idle';
  let currentNode = null;
  let session = null;
  try {
    const store = useGameStore();
    saveStatus = store?.saveStatus || 'idle';
    currentNode = store?.currentNode || null;
    session = store?.session || null;
  } catch (e) {
    // If rendered standalone
  }

  // Close inventory drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isInventoryOpen) {
        onToggleInventory?.(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInventoryOpen, onToggleInventory]);

  if (!character) return null;

  const handleToggle = () => {
    audio.playClick();
    onToggleInventory?.(!isInventoryOpen);
  };

  const handleClose = () => {
    onToggleInventory?.(false);
  };

  const hp = character.hp ?? 0;
  const maxHp = character.maxHp || 1;
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));

  const mana = character.mana ?? 10;
  const maxMana = character.maxMana || 10;
  const manaPercent = Math.max(0, Math.min(100, Math.round((mana / maxMana) * 100)));

  const isHpCritical = hpPercent <= 20;

  const inventory = character.inventory || [];
  const slots = Array(6).fill(null);
  inventory.slice(0, 6).forEach((item, idx) => {
    slots[idx] = item;
  });

  const isConsumable = (item) => {
    if (!item) return false;
    const cat = String(item.category || '').toLowerCase();
    const id = String(item.id || '').toLowerCase();
    return cat === 'obat' || cat === 'potion' || cat === 'consumable' || id.includes('potion');
  };

  return (
    <>
      {/* Minimal Supporting HUD Bar */}
      <header className="w-full bg-slate-950/85 backdrop-blur-md border-b border-white/5 px-4 md:px-5 py-3 flex flex-col gap-2.5 select-none">
        {/* Row 1: Identity & Inventory Status */}
        <div className="flex items-center justify-between gap-3">
          {/* Character Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <FantasyAvatar
              avatarId={character.avatarUrl}
              alt={character.name}
              className="w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-xl border border-white/10"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel font-bold text-sm md:text-base text-slate-100 tracking-wide truncate">
                  {character.name}
                </h2>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/5 text-slate-300 border border-white/10 font-medium capitalize shrink-0">
                  Lvl {character.level || 1} {character.characterClass}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 capitalize flex items-center gap-2 truncate">
                <span>{character.race}</span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Shield className="w-3 h-3 text-amber-400/80" />
                  AC {character.armorClass || 14}
                </span>
              </div>
            </div>
          </div>

          {/* Tension, Autosave, Gold & Inventory Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <AutosaveBadge status={saveStatus} />

            <DirectorTensionBadge
              tension={session?.pacingMetrics?.tension ?? 3}
              inCombat={false}
              mood={currentNode?.mood || 'tenang'}
            />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-bold shadow-sm">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{character.gold ?? 50} G</span>
            </div>

            <button
              onClick={handleToggle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label={`Buka Tas Inventaris (${inventory.length} item)`}
              title="Tas Inventaris"
            >
              <Backpack className="w-4 h-4 text-amber-400" />
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
                {inventory.length}
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Semantic Vitals (HP = Rose, Mana = Cyan) */}
        <div className="flex items-center gap-4 w-full pt-0.5">
          {/* Health Bar */}
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-medium mb-1">
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <Heart className={`w-3 h-3 fill-rose-500 text-rose-500 ${isHpCritical ? 'animate-ping' : ''}`} />
                HP {isHpCritical && <span className="text-[9px] uppercase font-bold text-rose-300">(Kritis!)</span>}
              </span>
              <span className="font-mono text-slate-300 text-[10px]">
                {hp} / {maxHp}
              </span>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isHpCritical ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-rose-600 to-rose-400'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Mana / Aether Bar */}
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-medium mb-1">
              <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Aether
              </span>
              <span className="font-mono text-slate-300 text-[10px]">
                {mana} / {maxMana}
              </span>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300 rounded-full"
                style={{ width: `${manaPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 6 Attributes Quick Bar: Information density without visual noise */}
      <div className="w-full bg-slate-950/40 px-4 md:px-5 py-1.5 flex items-center justify-between text-[10px] overflow-hidden select-none border-b border-white/5">
        {[
          { label: 'STR', val: character.str ?? 10 },
          { label: 'DEX', val: character.dex ?? 10 },
          { label: 'CON', val: character.con ?? 10 },
          { label: 'INT', val: character.int ?? 10 },
          { label: 'WIS', val: character.wis ?? 10 },
          { label: 'CHA', val: character.cha ?? 10 }
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center">
            <span className="font-semibold text-slate-500 text-[9px]">{stat.label}</span>
            <div className="flex items-baseline gap-0.5">
              <span className="font-mono text-slate-300">{stat.val}</span>
              <span className="font-mono text-amber-400/90 font-bold text-[9px]">{calculateMod(stat.val)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Adventurer's Satchel Modal / Drawer */}
      {isInventoryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="inventory-title"
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl p-5 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Backpack className="w-5 h-5 text-amber-400" />
                <h3 id="inventory-title" className="font-cinzel text-base font-bold text-amber-300 tracking-wide">
                  Tas Petualang (Adventurer's Satchel)
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
                aria-label="Tutup Tas"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 6-Slot Grid */}
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
              <div className="bg-slate-900/90 border border-white/10 rounded-xl p-3.5 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="font-cinzel font-bold text-sm text-amber-300">
                    {selectedItem.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    {selectedItem.category || 'Barang'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-outfit">
                  {selectedItem.effect || 'Sebuah barang petualangan berharga.'}
                </p>

                {/* Usable Feedback Indicator */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  {isConsumable(selectedItem) ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Dapat dikonsumsi langsung
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">
                      Gunakan melalui opsi narasi/adegan
                    </span>
                  )}

                  {isConsumable(selectedItem) && (
                    <button
                      onClick={() => {
                        onUseItem?.(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-cinzel transition-all cursor-pointer min-h-[44px]"
                    >
                      Gunakan Potion
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-500 font-outfit">
                Pilih salah satu barang di atas untuk memeriksa deskripsi & kegunaan.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
