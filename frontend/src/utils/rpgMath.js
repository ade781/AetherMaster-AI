// Utility functions for RPG calculations

export const calculateMod = (val) => {
  const m = Math.floor((val - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
};
