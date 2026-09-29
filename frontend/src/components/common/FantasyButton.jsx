import React from 'react';
import audio from '../../services/audioService';

/**
 * Standardized Fantasy Button Primitive
 * Provides accessible touch targets (min 44px for md/lg), consistent states,
 * audible feedback, and restrained fantasy aesthetics.
 */
export default function FantasyButton({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  sound = 'click', // 'click' | 'select' | 'none'
  ...props
}) {
  const handleClick = (e) => {
    if (disabled || loading) return;
    if (sound === 'select') audio.playSelect();
    else if (sound === 'click') audio.playClick();
    if (onClick) onClick(e);
  };

  const baseStyles = 'relative inline-flex items-center justify-center font-cinzel font-semibold tracking-wider transition-all duration-200 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] rounded-lg gap-1.5',
    md: 'text-xs md:text-sm px-5 py-2.5 min-h-[44px] rounded-xl gap-2',
    lg: 'text-sm md:text-base px-7 py-3.5 min-h-[48px] rounded-xl gap-2.5 font-bold'
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 border border-amber-300/40',
    secondary: 'bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 shadow-sm',
    outline: 'bg-transparent hover:bg-white/5 border border-white/20 hover:border-amber-400/60 text-slate-200 hover:text-white',
    danger: 'bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 hover:border-rose-500 text-rose-200 shadow-sm shadow-rose-950/40',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent'
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
}
