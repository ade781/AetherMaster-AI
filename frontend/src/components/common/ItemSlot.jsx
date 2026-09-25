import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ItemSlot({
  item,
  idx,
  isSelected = false,
  onClick
}) {
  const [hasError, setHasError] = useState(false);

  const getItemIcon = () => {
    if (hasError || !item) {
      return '/assets/items/item_01_potion_heal.png';
    }
    const icon = item.icon || item.id;
    if (icon.startsWith('/') || icon.startsWith('http')) {
      return icon;
    }
    return `/assets/items/${icon}.png`;
  };

  return (
    <motion.div
      whileHover={item ? { scale: 1.04 } : {}}
      whileTap={item ? { scale: 0.96 } : {}}
      onClick={onClick}
      className={`aspect-square rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all duration-150 cursor-pointer min-h-[48px] ${
        isSelected
          ? 'border-amber-400 bg-slate-800/90 shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
          : item
            ? 'border-slate-700/80 bg-slate-900/80 hover:border-amber-400/80 hover:bg-slate-800/80 shadow-sm'
            : 'border-slate-800/60 bg-slate-950/40 border-dashed opacity-50 cursor-default'
      }`}
    >
      {item ? (
        <>
          <img
            src={getItemIcon()}
            alt={item.name}
            className="w-10 h-10 object-contain mb-1 drop-shadow"
            onError={() => setHasError(true)}
            loading="lazy"
          />
          <span className="text-[10px] font-medium text-slate-200 line-clamp-1">
            {item.name}
          </span>
        </>
      ) : (
        <span className="text-[10px] text-slate-600 font-cinzel">
          Slot {idx !== undefined ? idx + 1 : 'Kosong'}
        </span>
      )}
    </motion.div>
  );
}
