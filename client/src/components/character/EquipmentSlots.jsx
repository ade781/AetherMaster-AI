import React, { useState } from 'react';
import { Shield, Sparkles, Sword, Package, ArrowUpRight, Flame, Heart, Zap, Sparkle } from 'lucide-react';

export const EquipmentSlots = ({ character, onEquipToggle }) => {
  const equipment = character.equipment || {};

  const slots = [
    { key: 'head', label: 'Kepala (Helm)', icon: '👑', item: equipment.head },
    { key: 'chest', label: 'Badan (Armor)', icon: '🛡️', item: equipment.chest },
    { key: 'mainHand', label: 'Tangan Utama (Senjata)', icon: '⚔️', item: equipment.mainHand },
    { key: 'offHand', label: 'Tangan Kiri (Perisai/Senjata)', icon: '🛡️', item: equipment.offHand },
    { key: 'ring', label: 'Cincin Sihir', icon: '💍', item: equipment.ring },
    { key: 'boots', label: 'Sepatu Langkah', icon: '🥾', item: equipment.boots },
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, slotKey) => {
    e.preventDefault();
    const itemData = e.dataTransfer.getData('text/plain');
    if (itemData) {
      try {
        const item = JSON.parse(itemData);
        onEquipToggle(item, slotKey, 'equip');
      } catch (err) {
        console.error('Gagal drop item', err);
      }
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5">
          <Shield size={16} /> Slot Perlengkapan Tempur
        </h4>
        <span className="text-[10px] text-slate-400">Drag item dari tas ke slot atau klik lepas</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {slots.map((slot) => (
          <div
            key={slot.key}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, slot.key)}
            className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[95px] relative group ${
              slot.item
                ? 'bg-amber-950/25 border-fantasy-gold/50 shadow-sm'
                : 'bg-slate-900/50 border-slate-800 border-dashed hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-slate-400 font-medium">{slot.label.split(' (')[0]}</span>
              <span className="text-sm">{slot.icon}</span>
            </div>

            {slot.item ? (
              <div>
                <div className="text-xs font-bold text-slate-200 mt-1 line-clamp-1">{slot.item.name}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {slot.item.acBonus ? `+${slot.item.acBonus} AC` : slot.item.damage || 'Aktif'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEquipToggle(slot.item, slot.key, 'unequip')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-medium underline"
                  >
                    Lepas
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic mt-auto">Kosong</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
