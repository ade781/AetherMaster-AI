import React from 'react';

/**
 * Standardized Fantasy Badge Primitive
 * Uniform badges for threat tiers, genres, item categories, and character levels.
 */
export default function FantasyBadge({
  children,
  variant = 'gold', // 'gold' | 'cyan' | 'crimson' | 'emerald' | 'neutral'
  size = 'sm', // 'sm' | 'md'
  icon: Icon,
  className = ''
}) {
  const variantStyles = {
    gold: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    crimson: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    neutral: 'bg-slate-800/80 border-white/10 text-slate-300'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm tracking-wider uppercase font-mono ${variantStyles[variant] || variantStyles.gold} ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
