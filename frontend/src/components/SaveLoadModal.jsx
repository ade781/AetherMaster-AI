import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Download, Upload, Clock, MapPin, Heart, Check, AlertCircle, RefreshCw } from 'lucide-react';
import FantasyModal from './common/FantasyModal';
import FantasyButton from './common/FantasyButton';
import FantasyBadge from './common/FantasyBadge';
import audio from '../services/audioService';
import storyApi, { API_BASE } from '../services/api';
import { formatErrorMessage } from '../utils/errorHandler';

export default function SaveLoadModal({
  isOpen,
  onClose,
  sessionId,
  onLoadSession
}) {
  const [slots, setSlots] = useState({ 0: null, 1: null, 2: null, 3: null });
  const [loading, setLoading] = useState(false);
  const [savingSlot, setSavingSlot] = useState(null);
  const [loadingSlot, setLoadingSlot] = useState(null);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  const fetchSlots = () => {
    setLoading(true);
    storyApi.getSaveSlots()
      .then(data => {
        if (data.success) {
          setSlots(data.data || {});
        }
      })
      .catch(err => console.error('Gagal memuat slot arsip:', err))
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
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveToSlot = async (slotNumber) => {
    if (!sessionId) return;
    setSavingSlot(slotNumber);
    audio.playSelect();
    try {
      const data = await storyApi.saveToSlot(sessionId, slotNumber);
      if (data.success) {
        showFeedback(`Progres berhasil diarsipkan ke Slot ${slotNumber === 0 ? 'Autosave' : slotNumber}!`);
        fetchSlots();
      } else {
        alert(formatErrorMessage(data.error, 'Gagal menyimpan progres.'));
      }
    } catch (err) {
      alert(formatErrorMessage(err, 'Koneksi server terganggu saat menyimpan.'));
    } finally {
      setSavingSlot(null);
    }
  };

  const handleLoadFromSlot = async (slotNumber) => {
    setLoadingSlot(slotNumber);
    audio.playSelect();
    try {
      const data = await storyApi.loadFromSlot(slotNumber);
      if (data.success) {
        onLoadSession(data.data);
        onClose();
      } else {
        alert(formatErrorMessage(data.error, 'Gagal memuat slot arsip.'));
      }
    } catch (err) {
      alert(formatErrorMessage(err, 'Koneksi server terganggu saat memuat.'));
    } finally {
      setLoadingSlot(null);
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
          showFeedback('Berkas arsip JSON berhasil diimpor!');
          onLoadSession(data.data);
          onClose();
        } else {
          alert(formatErrorMessage(data.error, 'Format berkas arsip JSON tidak valid.'));
        }
      } catch (err) {
        alert(formatErrorMessage(err, 'Gagal memproses berkas JSON.'));
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
    <FantasyModal
      isOpen={isOpen}
      onClose={onClose}
      title="Chronicle Archive (Arsip Petualangan)"
      subtitle="Kelola slot penyimpanan memori atau berkas arsip JSON petualang"
      icon={BookOpen}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Feedback Alert Toast */}
        {notification && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 font-medium animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Slot Grid List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-cinzel space-y-2">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin text-amber-400" />
              <p>Membaca gulungan arsip...</p>
            </div>
          ) : (
            [0, 1, 2, 3].map((slotNum) => {
              const slotData = slots[slotNum];
              const isAuto = slotNum === 0;

              return (
                <div
                  key={slotNum}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                    slotData
                      ? 'bg-slate-900/90 border-white/10 hover:border-amber-400/40'
                      : 'bg-slate-950/50 border-white/5 border-dashed'
                  }`}
                >
                  {/* Slot Details Header & Metadata */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FantasyBadge variant={isAuto ? 'cyan' : 'gold'} size="sm">
                        {isAuto ? 'Slot 0 (Autosave)' : `Slot ${slotNum}`}
                      </FantasyBadge>

                      {slotData && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatDate(slotData.savedAt)}
                        </span>
                      )}
                    </div>

                    {slotData ? (
                      <div className="space-y-1 pt-0.5">
                        <div className="font-cinzel text-sm font-bold text-white flex items-center gap-2 truncate">
                          <span>{slotData.campaignTitle || 'Kronik Petualangan'}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-amber-300 font-sans text-xs">
                            {slotData.characterName} (Lvl {slotData.characterLevel || 1} {slotData.characterClass})
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-300 truncate">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            {slotData.location || 'Lokasi Tak Dikenal'}
                          </span>
                          <span className="text-rose-400 flex items-center gap-1 font-mono">
                            <Heart className="w-3 h-3 fill-rose-500" />
                            {slotData.hp}/{slotData.maxHp} HP
                          </span>
                          <span className="text-slate-400 font-mono">
                            Babak #{slotData.turnCount || 1}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic py-1">
                        Slot Kosong (Belum ada catatan petualangan tersimpan)
                      </div>
                    )}
                  </div>

                  {/* Slot Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {sessionId && !isAuto && (
                      <FantasyButton
                        variant="secondary"
                        size="sm"
                        loading={savingSlot === slotNum}
                        disabled={savingSlot !== null || loadingSlot !== null}
                        onClick={() => handleSaveToSlot(slotNum)}
                      >
                        {slotData ? 'Timpa' : 'Simpan'}
                      </FantasyButton>
                    )}

                    {slotData && (
                      <FantasyButton
                        variant="primary"
                        size="sm"
                        loading={loadingSlot === slotNum}
                        disabled={savingSlot !== null || loadingSlot !== null}
                        onClick={() => handleLoadFromSlot(slotNum)}
                      >
                        Muat
                      </FantasyButton>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* External Archive Tools (Export & Import JSON) */}
        <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span className="font-mono text-[11px] text-slate-400">
            Cadangan Berkas Eksternal (.json)
          </span>

          <div className="flex items-center gap-2">
            {sessionId && (
              <FantasyButton
                variant="outline"
                size="sm"
                icon={Download}
                onClick={handleExportJson}
              >
                Ekspor JSON
              </FantasyButton>
            )}

            <FantasyButton
              variant="outline"
              size="sm"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
            >
              Impor JSON
            </FantasyButton>
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
    </FantasyModal>
  );
}
