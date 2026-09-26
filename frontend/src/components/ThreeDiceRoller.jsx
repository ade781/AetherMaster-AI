import React, { useEffect } from 'react';

/**
 * ThreeDiceRoller - Deprecated & Disabled.
 * Dice mechanics and visuals have been completely removed.
 */
export default function ThreeDiceRoller({ onComplete }) {
  useEffect(() => {
    onComplete?.();
  }, [onComplete]);

  return null;
}
