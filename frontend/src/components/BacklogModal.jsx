import React, { useState, useEffect } from 'react';
import { BookOpen, X, MapPin } from 'lucide-react';
import audio from '../services/audioService';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000/api/story';

export default function BacklogModal({ isOpen, onClose, sessionId }) {
  const [backlog, setBacklog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setLoading(true);
    fetch(`${API_BASE}/backlog/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBacklog(data.data || []);
        }
      })
      .catch(err => console.error('Gagal memuat backlog:', err))
      .finally(() => setLoading(false));
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-fantasy-card border-2 border-fantasy-gold/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-fantasy-gold/40 text-fantasy-gold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg md:text-xl font-bold text-fantasy-gold tracking-wide">
                Catatan Riwayat Dialog (Backlog)
              </h2>
              <p className="text-xs text-slate-400">
                Arsip lengkap dialog dan narasi petualangan yang telah kamu lewati.
              </p>
            </div>
          </div>
          <button
            onClick={() => { audio.playClick(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="text-xs text-slate-400 py-8 text-center">Membuka lembaran arsip...</div>
          ) : backlog.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center">Belum ada riwayat dialog sebelumnya.</div>
          ) : (
            backlog.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="font-cinzel text-xs font-bold text-fantasy-gold">
                    {item.speaker || 'Dungeon Master'}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.location || 'Lokasi Tak Dikenal'}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                  {item.dialogueText}
                </p>
                {item.consequenceNote && (
                  <p className="text-[11px] text-amber-300/80 italic pt-1">
                    › Konsekuensi: {item.consequenceNote}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
