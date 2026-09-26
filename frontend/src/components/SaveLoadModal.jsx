import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Upload, X, Clock, MapPin, Heart, Shield, RefreshCw, Check } from 'lucide-react';
import audio from '../services/audioService';
import { API_BASE } from '../store/GameContext';

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
    fetch(`${API_BASE}/saves`)
      .then(res => res.json())
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
      const res = await fetch(`${API_BASE}/saves/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          slotNumber
        })
      });
      const data = await res.json();
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
      const res = await fetch(`${API_BASE}/saves/load/${slotNumber}`);
      const data = await res.json();
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
        const res = await fetch(`${API_BASE}/saves/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionData })
        });
        const data = await res.json();
        if (data.success) {
          audio.playSelect();
          showFeedback('Save data JSON berhasil diimpor!');
          onLoadSession(data.data);
          onClose();
        } else {
          alert(data.error || 'Gagal mengimpor file.');
        }
      } catch (err) {
        alert('File JSON tidak valid atau korup.');
      }
    };
    reader.readAsText(file);
  };

  const slotLabels = [
    { num: 0, title: 'Auto-Save' },
    { num: 1, title: 'Manual Slot 1' },
    { num: 2, title: 'Manual Slot 2' },
    { num: 3, title: 'Manual Slot 3' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-fantasy-card border-2 border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg md:text-xl font-bold text-emerald-400 tracking-wide">
                Penyimpanan Lokal Multi-Slot & JSON Porter
              </h2>
              <p className="text-xs text-slate-400">
                Simpan progres petualanganmu ke database atau unduh berkas JSON.
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

        {/* Feedback Banner */}
        {notification && (
          <div className="bg-emerald-950/90 border-b border-emerald-600/50 px-6 py-2 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Slots Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-sm font-medium">Memuat data penyimpanan...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slotLabels.map(({ num, title }) => {
              const data = slots[num];
              const hasData = !!data;

              return (
                <div
                  key={num}
                  className={`p-4 rounded-xl border transition-all ${
                    hasData
                      ? 'bg-slate-950/80 border-slate-700 hover:border-emerald-500/60 shadow-lg'
                      : 'bg-slate-950/40 border-dashed border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="font-cinzel text-xs font-bold text-emerald-400">
                      {title}
                    </span>
                    {hasData && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(data.savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {hasData ? (
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="font-cinzel font-bold text-sm text-white">
                        {data.characterName} ({data.characterClass})
                      </div>
                      <div className="flex items-center gap-4 text-slate-400">
                        <span className="flex items-center gap-1 text-red-400">
                          <Heart className="w-3 h-3" /> {data.hp}/{data.maxHp} HP
                        </span>
                        <span className="flex items-center gap-1 text-fantasy-gold">
                          Koin: {data.gold}
                        </span>
                        <span>Giliran: {data.turnCount}</span>
                      </div>
                      <div className="text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {data.location || data.campaignTitle}
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleLoadFromSlot(num)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-cinzel font-bold text-xs transition-colors"
                        >
                          Muat (Load)
                        </button>
                        {num !== 0 && sessionId && (
                          <button
                            onClick={() => handleSaveToSlot(num)}
                            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-cinzel text-xs border border-slate-700 transition-colors"
                          >
                            Timpa (Save)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-2">
                      <p className="text-xs text-slate-500">Slot simpanan masih kosong.</p>
                      {num !== 0 && sessionId && (
                        <button
                          onClick={() => handleSaveToSlot(num)}
                          className="py-1.5 px-4 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-slate-950 font-cinzel font-bold text-xs transition-colors"
                        >
                          Simpan ke Sini
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* JSON Export & Import Footer Bar */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                disabled={!sessionId}
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Ekspor JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200 transition-colors"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                Impor JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </div>

            <button
              onClick={fetchSlots}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan Slot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
