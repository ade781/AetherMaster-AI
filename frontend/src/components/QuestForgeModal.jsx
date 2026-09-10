import React, { useState } from 'react';
import { Sparkles, X, Wand2, Compass, Flame, Skull, Anchor, RefreshCw } from 'lucide-react';
import { audio } from '../services/audioService';

const GENRES = [
  { id: 'dark_fantasy', label: 'Dark Fantasy', icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'gothic_horror', label: 'Gothic Horror', icon: <Skull className="w-3.5 h-3.5 text-rose-400" /> },
  { id: 'eldritch_mystery', label: 'Eldritch Mystery', icon: <Anchor className="w-3.5 h-3.5 text-cyan-400" /> },
  { id: 'epic_adventure', label: 'Epic Fantasy', icon: <Compass className="w-3.5 h-3.5 text-emerald-400" /> },
];

const PRESET_IDEAS = [
  "Menyusup ke dalam pesta dansa topeng istana vampir di puncak gunung salju untuk mencari bangsawan yang diculik.",
  "Investigasi kapal hantu bajak laut yang terdampar di pelabuhan terbengkalai dengan kargo peti terkutuk.",
  "Melarikan diri dari penjara sihir bawah tanah tempat para alkemis terlarang melakukan eksperimen rahasia.",
  "Mencari makam naga purba di padang pasir tandus sebelum faksi kultus kegelapan membangkitkannya.",
];

export function QuestForgeModal({ isOpen, onClose, onCampaignCreated }) {
  const [premise, setPremise] = useState('');
  const [genre, setGenre] = useState('dark_fantasy');
  const [isForging, setIsForging] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRandomIdea = () => {
    audio.playClick();
    const random = PRESET_IDEAS[Math.floor(Math.random() * PRESET_IDEAS.length)];
    setPremise(random);
  };

  const handleForge = async (e) => {
    e.preventDefault();
    if (!premise.trim() || isForging) return;

    setIsForging(true);
    setError(null);
    audio.playClick();

    try {
      const res = await fetch('http://localhost:5000/api/story/campaigns/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ premise, genre }),
      });

      const data = await res.json();
      if (data.success && data.campaign) {
        audio.playSceneTransition();
        onCampaignCreated(data.campaign);
        onClose();
      } else {
        throw new Error(data.error || 'Gagal meracik kampanye.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsForging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 border border-amber-500/40 rounded-3xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden relative">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-400 font-serif font-bold text-lg">
            <Wand2 className="w-5 h-5 text-amber-400" />
            <span>AI Quest Forge • Tempa Petualangan Kustom</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleForge} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                Ide / Premis Cerita Anda
              </label>
              <button
                type="button"
                onClick={handleRandomIdea}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Inspirasi Acak</span>
              </button>
            </div>
            <textarea
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="Contoh: Menyelidiki kastil terbengkalai di tepi danau berkabut di mana suara nyanyian gaib memikat para pengembara..."
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-100 placeholder-slate-500 text-sm outline-none resize-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Pilih Nuansa Genre
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => {
                    audio.playClick();
                    setGenre(g.id);
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                    genre === g.id
                      ? 'border-amber-500 bg-amber-950/50 text-amber-300'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {g.icon}
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isForging || !premise.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-900/40 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isForging ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Sedang Meracik Dunia...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Tempa Petualangan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
