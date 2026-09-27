import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Clock, Award, X, Sparkles, AlertCircle } from 'lucide-react';
import audio from '../services/audioService';
import { API_BASE } from '../store/GameContext';

export default function QuestModal({ isOpen, onClose, campaignId, session, character, campaign }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !campaignId) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/quests/${campaignId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setQuests(data.data);
        } else {
          setError(data.error || 'Gagal memuat daftar misi.');
        }
      })
      .catch(err => {
        console.error('Quests fetch error:', err);
        setError('Gagal terhubung ke server.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, campaignId]);

  if (!isOpen) return null;

  // Mission Log from session
  let parsedLog = session?.missionLog;
  if (typeof parsedLog === 'string') {
    try {
      parsedLog = JSON.parse(parsedLog);
    } catch {
      parsedLog = null;
    }
  }

  const activeTargetGoal = parsedLog?.targetGoal || parsedLog?.objective || campaign?.premise || 'Selesaikan penyelidikan di wilayah saat ini.';

  return (
    <div
      id="quest-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="quest-modal-container"
        className="relative w-full max-w-2xl bg-slate-950/95 border border-amber-500/40 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/30 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  Sasaran Petualangan
                </span>
                <h2 className="font-cinzel text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100">
                  Daftar Misi & Objektif
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-amber-200 font-medium">{character?.name || 'Petualang'}</span>
                <span>•</span>
                <span>Babak {session?.turnCount || 1}</span>
              </div>
            </div>
          </div>
          <button
            id="quest-modal-close-btn"
            onClick={() => { audio.playClick(); onClose(); }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Dynamic Target Goal Card */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-amber-950/20 to-transparent border-b border-white/10">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Instruksi Misi Terkini
              </div>
              <p className="text-sm font-medium text-slate-100 mt-1 leading-relaxed">
                {activeTargetGoal}
              </p>
            </div>
          </div>
        </div>

        {/* Quest List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 scrollbar-thin">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <p className="text-xs">Memuat status sasaran petualangan...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && quests.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              Belum ada misi terdaftar untuk kampanye ini. Petualangan berjalan bebas mengikuti arahan narasi.
            </div>
          )}

          {!loading && !error && quests.map(q => {
            const objectives = q.objectives || [];
            return (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-amber-500/30 transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      q.type === 'main'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {q.type === 'main' ? 'Misi Utama' : 'Misi Sampingan'}
                    </span>
                    <h3 className="text-base font-cinzel font-bold text-slate-100">{q.title}</h3>
                  </div>
                  {q.rewardGold > 0 && (
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Award className="w-3.5 h-3.5" />
                      +{q.rewardGold} Gold
                    </span>
                  )}
                </div>

                {q.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">{q.description}</p>
                )}

                {/* Objectives */}
                {objectives.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Objektif Penyelesaian:
                    </div>
                    {objectives.map((obj, oIdx) => {
                      const runtimeObj = session?.questState?.objectives?.[obj.id] ||
                        (Array.isArray(session?.missionLog?.objectives) ? session.missionLog.objectives.find(o => o.id === obj.id) : null);
                      const isCompleted = Boolean(runtimeObj?.completed);
                      const currentCount = runtimeObj?.currentCount ?? (isCompleted ? obj.requiredCount : 0);
                      const requiredCount = obj.requiredCount || 1;

                      return (
                        <div
                          key={obj.id || oIdx}
                          className="flex items-start gap-2.5 text-xs text-slate-300 bg-black/30 p-2.5 rounded-xl border border-white/5"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`text-xs ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {obj.description}
                            </p>
                            <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                              Progres: {currentCount} / {requiredCount} {isCompleted ? '• Tuntas' : '• Dalam Proses'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Objektif dinamis diverifikasi oleh State Engine</span>
          <button
            onClick={() => { audio.playClick(); onClose(); }}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
