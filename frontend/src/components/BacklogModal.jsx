import React from 'react';
import { BookOpen, X, ChevronRight } from 'lucide-react';

export function BacklogModal({ isOpen, onClose, history = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
            <BookOpen className="w-5 h-5" />
            <span>Riwayat Catatan Petualangan ({history.length} Adegan)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Belum ada riwayat dialog. Petualangan baru saja dimulai!
            </div>
          ) : (
            history.map((entry, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                  <span>{entry.speaker || 'Dungeon Master'}</span>
                  <span className="text-slate-500 text-[10px]">{entry.location}</span>
                </div>
                <p className="text-sm text-slate-300 font-sans leading-relaxed">
                  {entry.dialogue}
                </p>
                {entry.chosenAction && (
                  <div className="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                    <ChevronRight className="w-3 h-3" />
                    <span>Pilihan Anda: "{entry.chosenAction}"</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs transition-colors"
          >
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  );
}
