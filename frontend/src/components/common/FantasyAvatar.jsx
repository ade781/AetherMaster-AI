import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function FantasyAvatar({
  avatarId,
  alt = 'Character Portrait',
  className = '',
  isNpc = false
}) {
  const [hasError, setHasError] = useState(false);

  const getSource = () => {
    if (hasError || !avatarId) {
      return isNpc ? '/assets/portraits/char_npc_01_barkeep.png' : '/assets/portraits/char_hero_01_paladin.png';
    }
    if (avatarId.startsWith('/') || avatarId.startsWith('http')) {
      return avatarId;
    }
    return `/assets/portraits/${avatarId}.png`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl bg-slate-900 border border-white/10 ${className}`}
    >
      <img
        src={getSource()}
        alt={alt}
        className="w-full h-full object-cover object-top"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </motion.div>
  );
}
