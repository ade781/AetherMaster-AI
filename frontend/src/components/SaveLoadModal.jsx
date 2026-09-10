import React, { useState, useEffect } from 'react';
import { Database, FolderOpen, Trash2, X, Clock, MapPin, RefreshCw } from 'lucide-react';
import { audio } from '../services/audioService';

export function SaveLoadModal({ isOpen, onClose, onLoadSession, activeSessionId }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/story/sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
      } else {
        throw new Error('Gagal mengambil daftar sesi.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Hapus sesi petualangan ini dari database?')) return;
    try {
      await fetch(`http://localhost:5000/api/story/sessions/${id}`, {
        method: 'DELETE',
      });
      audio.playClick();
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Gagal menghapus sesi: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
            <Database className="w-5 h-5" />
            <span>Daftar Sesi Database (Sequelize)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-3 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs">Menghubungkan ke SQLite Database...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-rose-400 text-xs">
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Belum ada sesi yang tersimpan di database.
            </div>
          ) : (
            sessions.map((sess) => {
              const isCurrent = sess.id === activeSessionId;
              const formattedDate = new Date(sess.updatedAt).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    audio.playClick();
                    onLoadSession(sess.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isCurrent
                      ? 'border-amber-500/70 bg-amber-950/30'
                      : 'border-slate-800 bg-slate-900/60 hover:border-amber-500/40 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {sess.title}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                          Sedang Aktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        {sess.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(sess.id, e)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Hapus Sesi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <FolderOpen className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs text-slate-400">
          <span>Total {sessions.length} sesi tersimpan di SQLite</span>
          <button
            onClick={fetchSessions}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
