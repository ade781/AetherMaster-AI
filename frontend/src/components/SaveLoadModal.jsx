import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Upload, X, Clock, MapPin, Heart, Shield, RefreshCw, Check } from 'lucide-react';
import audio from '../services/audioService';
import storyApi, { API_BASE } from '../services/api';

export default function SaveLoadModal({
  isOpen,
  onClose,
  sessionId,
  onLoadSession
}) {
  const [slots, setSlots] = useState({ 0: null, 1: null, 2: null, 3: null });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  const fetchSlots = () => {
    setLoading(true);
    storyApi.getSaveSlots()
      .then(data => {
        if (data.success) {
          setSlots(data.data);
        }
      })
      .catch(err => console.error('Gagal memuat slot simpanan:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchSlots();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showFeedback = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveToSlot = async (slotNumber) => {
    if (!sessionId) return;
    audio.playSelect();
    try {
      const data = await storyApi.saveToSlot(sessionId, slotNumber);
      if (data.success) {
        showFeedback(`Berhasil disimpan ke Slot ${slotNumber === 0 ? 'Auto' : slotNumber}!`);
        fetchSlots();
      } else {
        alert(data.error || 'Gagal menyimpan.');
      }
    } catch (err) {
      alert('Koneksi server gagal saat menyimpan.');
    }
  };

  const handleLoadFromSlot = async (slotNumber) => {
    audio.playSelect();
    try {
      const data = await storyApi.loadFromSlot(slotNumber);
      if (data.success) {
        onLoadSession(data.data);
        onClose();
      } else {
        alert(data.error || 'Gagal memuat slot.');
      }
    } catch (err) {
      alert('Koneksi server gagal saat memuat.');
    }
  };

  const handleExportJson = () => {
    if (!sessionId) return;
    audio.playClick();
    window.open(`${API_BASE}/saves/export/${sessionId}`, '_blank');
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const sessionData = JSON.parse(event.target.result);
        const data = await storyApi.importSession(sessionData);
        if (data.success) {
          showFeedback('Berhasil mengimpor progres petualangan!');
          onLoadSession(data.data);
          onClose();
        } else {
          alert(data.error || 'Format file save JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-fantasy-card border-2 border-fantasy-gold/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-fantasy-gold/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg md:text-xl font-bold text-amber-300 tracking-wide">
                Simpan & Muat Progres Petualangan
              </h2>
              <p className="text-xs text-slate-400">
                Pilih slot penyimpanan memori atau kelola berkas arsip (JSON).
              </p>
            </div>
          </div>
          <button
            onClick={() => { audio.playClick(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 text-emerald-200 px-6 py-2 text-xs flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Slots List */}
          <div className="grid grid-cols-1 gap-3">
            {[0, 1, 2, 3].map((slotNum) => {
              const slotData = slots[slotNum];
              const isAuto = slotNum === 0;

              return (
                <div
                  key={slotNum}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    slotData
                      ? 'bg-slate-900/90 border-slate-700/80 hover:border-amber-400/50'
                      : 'bg-slate-950/40 border-slate-800/60 border-dashed'
                  }`}
                >
                  {/* Slot Details */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-cinzel font-bold px-2.5 py-0.5 rounded-full ${
                        isAuto
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}>
                        {isAuto ? 'Slot 0 (Autosave)' : `Slot ${slotNum}`}
                      </span>

                      {slotData && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatDate(slotData.savedAt)}
                        </span>
                      )}
                    </div>

                    {slotData ? (
                      <div className="space-y-0.5 pt-1">
                        <div className="font-cinzel text-sm font-bold text-white flex items-center gap-2 truncate">
                          <span>{slotData.campaignTitle || 'Kampanye Petualangan'}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-amber-400 font-sans text-xs">
                            {slotData.characterName} (Lvl {slotData.characterLevel || 1} {slotData.characterClass})
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span className="flex items-center gap-1 text-slate-300 truncate">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            {slotData.currentLocation || 'Lokasi Tak Dikenal'}
                          </span>
                          <span className="text-rose-400 flex items-center gap-1 font-mono">
                            <Heart className="w-3 h-3 fill-rose-500" />
                            {slotData.characterHp}/{slotData.characterMaxHp} HP
                          </span>
                          <span className="text-slate-400 font-mono">
                            Babak #{slotData.turnCount || 1}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic py-1">
                        Slot Kosong (Belum ada catatan petualangan)
                      </div>
                    )}
                  </div>

                  {/* Slot Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {sessionId && !isAuto && (
                      <button
                        onClick={() => handleSaveToSlot(slotNum)}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold font-cinzel transition-colors flex items-center gap-1.5 min-h-[36px]"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{slotData ? 'Timpa' : 'Simpan'}</span>
                      </button>
                    )}

                    {slotData && (
                      <button
                        onClick={() => handleLoadFromSlot(slotNum)}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold font-cinzel transition-all shadow-md flex items-center gap-1.5 min-h-[36px]"
                      >
                        <span>Muat</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cloud/JSON Backup Tools */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="font-mono text-[11px]">
              Berkas Arsip Lokal (Cadangan Eksternal)
            </span>

            <div className="flex items-center gap-2">
              {sessionId && (
                <button
                  onClick={handleExportJson}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Unduh berkas JSON petualangan aktif"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor JSON</span>
                </button>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Unggah berkas JSON simpanan sebelumnya"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Impor JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJson}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
