/**
 * D&D 5E Combat Status Effects & Conditions Catalog
 */

export const STATUS_EFFECTS_MAP = {
  stunned: {
    label: 'Stunned',
    description: 'Karakter lumpuh sejenak dan tidak dapat mengambil aksi pada giliran ini.',
    iconName: 'Zap',
    color: 'amber'
  },
  poisoned: {
    label: 'Poisoned',
    description: 'Racun mengalir dalam darah; terkena kerugian pada serangan.',
    iconName: 'Skull',
    color: 'emerald'
  },
  blessed: {
    label: 'Blessed',
    description: 'Diberkati kekuatan dewa; +1d4 pada lemparan serangan dan saving throw.',
    iconName: 'Sparkles',
    color: 'gold'
  },
  shielded: {
    label: 'Shielded',
    description: 'Dilindungi sihir arkanum; +2 Armor Class sementara.',
    iconName: 'Shield',
    color: 'cyan'
  },
  burning: {
    label: 'Burning',
    description: 'Terbakar api aether; menerima damage api di awal setiap ronde.',
    iconName: 'Flame',
    color: 'rose'
  },
  weakened: {
    label: 'Weakened',
    description: 'Daya serang fisik melemah akibat kutukan bayangan.',
    iconName: 'Activity',
    color: 'purple'
  }
};
