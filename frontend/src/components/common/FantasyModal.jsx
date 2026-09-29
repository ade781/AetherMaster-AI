import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import audio from '../../services/audioService';

/**
 * Standardized Fantasy Modal Shell
 * Implements accessible keyboard traps (Esc to close), focus state,
 * controlled backdrop blur, and dark obsidian-gold fantasy frame.
 */
export default function FantasyModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  maxWidth = 'max-w-2xl',
  headerActions = null,
  footer = null,
  accentColor = 'gold' // 'gold' | 'cyan' | 'rose'
}) {
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        audio.playClick();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const accentBorderStyles = {
    gold: 'border-fantasy-gold/30',
    cyan: 'border-cyan-500/40',
    rose: 'border-rose-600/40'
  };

  const accentIconStyles = {
    gold: 'bg-amber-950/40 border-amber-500/40 text-amber-400',
    cyan: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400',
    rose: 'bg-rose-950/40 border-rose-600/40 text-rose-400'
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        onClick={() => { audio.playClick(); onClose(); }}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full ${maxWidth} my-auto bg-slate-950/95 border ${accentBorderStyles[accentColor] || accentBorderStyles.gold} rounded-2xl shadow-2xl shadow-black/80 flex flex-col max-h-[90vh] overflow-hidden`}
        >
          {/* Modal Header */}
          <div className="px-5 py-4 sm:px-6 bg-slate-900/90 border-b border-white/5 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div className={`w-9 h-9 rounded-xl border p-1.5 flex items-center justify-center shrink-0 ${accentIconStyles[accentColor] || accentIconStyles.gold}`}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <h2 id="modal-title" className="font-cinzel text-base sm:text-lg font-bold text-white tracking-wide truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-slate-400 font-light truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              <button
                type="button"
                onClick={() => { audio.playClick(); onClose(); }}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer"
                aria-label="Tutup jendela modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar text-slate-200">
            {children}
          </div>

          {/* Optional Modal Footer */}
          {footer && (
            <div className="px-5 py-3.5 sm:px-6 bg-slate-900/60 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
