import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Download, Upload, Clock, MapPin, Heart, Check, AlertCircle, RefreshCw, AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import FantasyModal from './common/FantasyModal';
import FantasyButton from './common/FantasyButton';
import FantasyBadge from './common/FantasyBadge';
import audio from '../services/audioService';
import storyApi, { API_BASE } from '../services/api';
import { formatErrorMessage } from '../utils/errorHandler';
import { useGameStore } from '../store/GameContext';

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
  const [notification, setNotification] = useState(null); // { message, type: 'success' | 'error' }
  const [overwriteConfirmSlot, setOverwriteConfirmSlot] = useState(null);
  const fileInputRef = useRef(null);

  let activeChar = null;
  let activeNode = null;
  try {
    const store = useGameStore();
    activeChar = store?.character || null;
    activeNode = store?.currentNode || null;
  } catch (e) {
    // If mounted outside GameProvider (e.g. standalone test)
  }

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
      setOverwriteConfirmSlot(null);
      fetchSlots();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showFeedback = (msg, type = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInitiateSave = (slotNumber, hasExistingData) => {
    if (hasExistingData) {
      setOverwriteConfirmSlot(slotNumber);
    } else {
      executeSaveToSlot(slotNumber);
    }
  };

  const executeSaveToSlot = async (slotNumber) => {
    if (!sessionId) return;
    setOverwriteConfirmSlot(null);
    setSavingSlot(slotNumber);
    audio.playSelect();
    try {
      const data = await storyApi.saveToSlot(sessionId, slotNumber);
      if (data.success) {
        showFeedback(`Progres berhasil disimpan ke Slot ${slotNumber}!`, 'success');
        fetchSlots();
      } else {
        showFeedback(formatErrorMessage(data.error, 'Gagal menyimpan progres.'), 'error');
      }
    } catch (err) {
      showFeedback(formatErrorMessage(err, 'Koneksi server terganggu saat menyimpan.'), 'error');
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
        showFeedback(formatErrorMessage(data.error, 'Gagal memuat slot arsip.'), 'error');
      }
    } catch (err) {
      showFeedback(formatErrorMessage(err, 'Koneksi server terganggu saat memuat.'), 'error');
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
          showFeedback('Berkas arsip JSON berhasil diimpor!', 'success');
          onLoadSession(data.data);
          onClose();
        } else {
          showFeedback(formatErrorMessage(data.error, 'Format berkas arsip JSON tidak valid.'), 'error');
        }
      } catch (err) {
        showFeedback(formatErrorMessage(err, 'Gagal memproses berkas JSON.'), 'error');
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
      subtitle="Kelola slot penyimpanan memori atau cadangan JSON petualangan"
      icon={BookOpen}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* In-Modal Feedback Alert Toast */}
        {notification && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-medium animate-fadeIn ${
              notification.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{notification.message}</span>
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
              const isConfirmingOverwrite = overwriteConfirmSlot === slotNum;

              return (
                <div
                  key={slotNum}
                  className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                    slotData
                      ? isAuto
                        ? 'bg-cyan-950/20 border-cyan-500/20 hover:border-cyan-400/40'
                        : 'bg-slate-900/90 border-white/10 hover:border-amber-400/40'
                      : 'bg-slate-950/50 border-white/5 border-dashed'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    {/* Slot Details Header & Metadata */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FantasyBadge variant={isAuto ? 'cyan' : 'gold'} size="sm">
                          {isAuto ? 'AUTOSAVE' : `SLOT ${slotNum}`}
                        </FantasyBadge>

                        <span className="text-[11px] text-slate-400">
                          {isAuto ? 'Tersimpan otomatis' : 'Manual Save'}
                        </span>

                        {slotData && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono ml-auto sm:ml-0">
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
                          {isAuto
                            ? 'Belum ada catatan autosave. Sistem akan menyimpan otomatis setelah tindakan penting.'
                            : 'Slot Kosong. Catatan petualangan belum disimpan di slot ini.'}
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
                          onClick={() => handleInitiateSave(slotNum, Boolean(slotData))}
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

                  {/* Diegetic Overwrite Comparison Panel */}
                  {isConfirmingOverwrite && (
                    <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-3 mt-1 animate-fadeIn">
                      <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Konfirmasi Penimpaan Arsip Slot {slotNum}</span>
                      </div>

                      {/* Diegetic Side-by-Side Comparison Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-sans">
                        {/* Old Record Card */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-500/30 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block border-b border-rose-500/20 pb-1">
                            Arsip Lama (Akan Digantikan)
                          </span>
                          <div className="text-slate-200 font-cinzel font-semibold truncate">
                            {slotData?.characterName || 'Karakter'}
                          </div>
                          <div className="text-slate-400 flex items-center justify-between">
                            <span>Tingkat:</span>
                            <span className="font-mono text-rose-300">Lvl {slotData?.characterLevel || 1} {slotData?.characterClass}</span>
                          </div>
                          <div className="text-slate-400 flex items-center justify-between">
                            <span>Lokasi:</span>
                            <span className="text-slate-300 truncate max-w-[120px]">{slotData?.location || '-'}</span>
                          </div>
                          <div className="text-slate-400 flex items-center justify-between">
                            <span>Kondisi HP:</span>
                            <span className="font-mono text-rose-400">{slotData?.hp}/{slotData?.maxHp} HP</span>
                          </div>
                          <div className="text-slate-500 text-[10px] flex items-center gap-1 pt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{formatDate(slotData?.savedAt)}</span>
                          </div>
                        </div>

                        {/* New Active Session Card */}
                        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block border-b border-emerald-500/20 pb-1">
                            Data Baru (Sesi Aktif)
                          </span>
                          <div className="text-slate-200 font-cinzel font-semibold truncate">
                            {activeChar?.name || 'Petualang Saat Ini'}
                          </div>
                          <div className="text-slate-400 flex items-center justify-between">
                            <span>Tingkat:</span>
                            <span className="font-mono text-emerald-300">Lvl {activeChar?.level || 1} {activeChar?.characterClass}</span>
                          </div>
                          <div className="text-slate-400 flex items-center justify-between">
                            <span>Lokasi:</span>
                            <span className="text-slate-300 truncate max-w-[120px]">{activeNode?.location || 'Wilayah Petualangan'}</span>
                          </div>
                          <div className="text-slate-400 flex items-center justify-between">
                            <span>Kondisi HP:</span>
                            <span className="font-mono text-emerald-400">{activeChar?.hp ?? 20}/{activeChar?.maxHp ?? 20} HP</span>
                          </div>
                          <div className="text-emerald-400/80 text-[10px] flex items-center gap-1 pt-0.5">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>Waktu Saat Ini (Sesi Berjalan)</span>
                          </div>
                        </div>
                      </div>

                      {/* Confirmation Action Buttons */}
                      <div className="flex items-center gap-2 justify-end pt-1">
                        <FantasyButton
                          size="xs"
                          variant="secondary"
                          onClick={() => setOverwriteConfirmSlot(null)}
                        >
                          Batal
                        </FantasyButton>
                        <FantasyButton
                          size="xs"
                          variant="danger"
                          loading={savingSlot === slotNum}
                          onClick={() => executeSaveToSlot(slotNum)}
                        >
                          Ya, Timpa Slot Ini
                        </FantasyButton>
                      </div>
                    </div>
                  )}
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
