import React from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';

export default function AutosaveBadge({ status = 'idle', lastSavedAt = null }) {
  if (status === 'idle') return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono backdrop-blur-md shadow-sm transition-all animate-fadeIn select-none border">
      {status === 'saving' && (
        <span className="flex items-center gap-1 text-amber-300 bg-amber-500/10 border-amber-500/30">
          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
          <span>Menyimpan...</span>
        </span>
      )}
      {status === 'saved' && (
        <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 border-emerald-500/30">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Tersimpan ✓</span>
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1 text-rose-300 bg-rose-500/10 border-rose-500/30" title="Autosave belum berhasil tersimpan">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <span>Gagal Simpan</span>
        </span>
      )}
    </div>
  );
}
