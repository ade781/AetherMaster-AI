import React, { useState, useEffect } from 'react';
import { BookOpen, MapPin, Users, Globe, X, Compass, Award, Shield, Sparkles } from 'lucide-react';
import audio from '../services/audioService';
import { API_BASE } from '../store/GameContext';

export default function JournalModal({ isOpen, onClose, sessionId, session, character, campaign }) {
  const [activeTab, setActiveTab] = useState('facts');
  const [journalData, setJournalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/journal/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setJournalData(data.data);
        } else {
          setError(data.error || 'Gagal memuat jurnal.');
        }
      })
      .catch(err => {
        console.error('Journal fetch error:', err);
        setError('Gagal terhubung ke server.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const worldFacts = journalData?.worldFacts || [];
  const visitedLocations = journalData?.visitedLocations || [];
  const metNpcs = journalData?.metNpcs || [];
  const reputation = journalData?.reputation || session?.worldLedger?.reputation || {};

  return (
    <div
      id="journal-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="journal-modal-container"
        className="relative w-full max-w-3xl bg-slate-950/95 border border-amber-500/40 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/30 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  Arsip Petualang
                </span>
                <h2 className="font-cinzel text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100">
                  Jurnal Dunia Aether
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-amber-200 font-medium">{character?.name || 'Petualang'}</span>
                <span>•</span>
                <span>{campaign?.title || 'Petualangan Aether'}</span>
                <span>•</span>
                <span>Babak {session?.turnCount || 1}</span>
              </div>
            </div>
          </div>
          <button
            id="journal-modal-close-btn"
            onClick={() => { audio.playClick(); onClose(); }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2.5 bg-slate-900/60 border-b border-white/10 overflow-x-auto scrollbar-thin">
          <button
            id="journal-tab-facts"
            onClick={() => { audio.playClick(); setActiveTab('facts'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'facts'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Fakta Terungkap ({worldFacts.length})</span>
          </button>

          <button
            id="journal-tab-locations"
            onClick={() => { audio.playClick(); setActiveTab('locations'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'locations'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Wilayah Dijelajahi ({visitedLocations.length})</span>
          </button>

          <button
            id="journal-tab-npcs"
            onClick={() => { audio.playClick(); setActiveTab('npcs'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'npcs'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Sosok Ditemui ({metNpcs.length})</span>
          </button>

          <button
            id="journal-tab-reputation"
            onClick={() => { audio.playClick(); setActiveTab('reputation'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'reputation'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Reputasi Fraksi</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 scrollbar-thin">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <p className="text-xs">Menyinkronkan lembar jurnal dari dunia...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
              {error}
            </div>
          )}

          {!loading && !error && activeTab === 'facts' && (
            <div className="space-y-3">
              {worldFacts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Belum ada catatan fakta khusus yang terungkap dalam babak ini. Selidiki petunjuk untuk membuka misteri dunia!
                </div>
              ) : (
                worldFacts.map((wf, idx) => (
                  <div
                    key={wf.id || idx}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-amber-500/30 transition-all flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-mono flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-200 leading-relaxed">{wf.fact}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                        <span className="capitalize font-mono text-amber-400/80">Turn {wf.turn || 1}</span>
                        {wf.subjectType && (
                          <>
                            <span>•</span>
                            <span className="uppercase text-[10px] tracking-wide text-slate-400">{wf.subjectType}</span>
                          </>
                        )}
                        {wf.importance === 'high' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                            Penting
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && !error && activeTab === 'locations' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {visitedLocations.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 text-xs">
                  Belum ada riwayat lokasi yang tercatat.
                </div>
              ) : (
                visitedLocations.map((loc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 hover:border-amber-500/30 transition-all flex items-center gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-inner">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-100 truncate">{loc.location}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pertama dikunjungi pada Babak {loc.firstVisitedTurn}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && !error && activeTab === 'npcs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {metNpcs.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 text-xs">
                  Belum ada catatan interaksi dengan sosok penting.
                </div>
              ) : (
                metNpcs.map((npc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 hover:border-amber-500/30 transition-all flex items-center gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-inner">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-100 truncate">{npc.speaker}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Berinteraksi sejak Babak {npc.firstMetTurn}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && !error && activeTab === 'reputation' && (
            <div className="space-y-3">
              {Object.keys(reputation).length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Reputasi dengan faksi-faksi utama masih berada dalam posisi netral (0). Pilihan tindakanmu akan menentukan kesetiaan mereka!
                </div>
              ) : (
                Object.entries(reputation).map(([faction, score]) => {
                  const numScore = Number(score) || 0;
                  const isPositive = numScore > 0;
                  const isNegative = numScore < 0;
                  return (
                    <div
                      key={faction}
                      className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-slate-200 capitalize">{faction}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            isPositive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isNegative
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isPositive ? `+${numScore}` : numScore}
                        </span>
                        <span className="text-slate-400 font-sans text-xs">
                          {isPositive ? 'Dihormati' : isNegative ? 'Bermusuhan' : 'Netral'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Fakta dan interaksi diperbarui otomatis oleh narasi engine</span>
          </div>
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
