import React, { useState } from 'react';
import { Moon, Coffee } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

export const CampfireRest = ({ character, onUpdateCharacter }) => {
  const [restLog, setRestLog] = useState(
    'Api unggun berkobar hangat mengusir dinginnya malam. Kamu bisa beristirahat sejenak (Short Rest) atau tidur semalaman penuh (Long Rest).'
  );
  const [resting, setResting] = useState(false);

  // Short Rest (Recover partial HP)
  const handleShortRest = async () => {
    setResting(true);
    audioEngine.playDiceRoll();

    setTimeout(async () => {
      const conMod = Math.floor(((character.constitution || 10) - 10) / 2);
      const recovered = Math.floor(Math.random() * 8) + 1 + Math.max(1, conMod);
      const newHp = Math.min(character.maxHp, (character.currentHp || 10) + recovered);

      setRestLog(`🔥 Kamu melakukan Short Rest selama 1 jam. Nafasmu kembali teratur dan kamu memulihkan +${recovered} HP!`);
      setResting(false);

      try {
        await fetch(`/api/characters/${character.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentHp: newHp }),
        });
        onUpdateCharacter?.({ ...character, currentHp: newHp });
      } catch (e) {
        console.error('Gagal memperbarui HP setelah istirahat:', e);
      }
    }, 1000);
  };

  // Long Rest (Recover full HP + Spell Slots)
  const handleLongRest = async () => {
    setResting(true);
    audioEngine.playSpellCast();

    setTimeout(async () => {
      const fullHp = character.maxHp || 15;
      const refreshedSlots = {
        level1: { max: 3, current: 3 },
        level2: { max: 2, current: 2 },
      };

      // 20% Chance Night Encounter
      const nightRandom = Math.random();
      if (nightRandom < 0.25) {
        setRestLog(
          '🌙 Selama Long Rest di tengah malam, kamu terbangun mendengar desis ular raksasa di balik semak! Kamu berhasil mengusirnya dengan obor dan melanjutkan tidur hingga fajar menyingsing. HP & Slot Mantra pulih 100%!'
        );
      } else {
        setRestLog('☀️ Fajar menyingsing di ufuk timur. Tidurmu nyenyak tanpa gangguan. Seluruh HP dan Slot Mantra pulih sepenuhnya 100%!');
      }

      setResting(false);

      try {
        await fetch(`/api/characters/${character.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentHp: fullHp, spellSlots: refreshedSlots }),
        });
        onUpdateCharacter?.({ ...character, currentHp: fullHp, spellSlots: refreshedSlots });
      } catch (e) {
        console.error('Gagal memperbarui data setelah Long Rest:', e);
      }
    }, 1200);
  };

  return (
    <div className="space-y-5">
      {/* Campfire Scenery Stage */}
      <div className="relative rounded-2xl overflow-hidden border border-fantasy-border h-64 shadow-2xl flex items-center justify-center text-center p-6">
        <img
          src="https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=1200&auto=format&fit=crop&q=80"
          alt="Api Unggun Malam Hari"
          className="absolute inset-0 w-full h-full object-cover filter brightness-50"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-lg">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-fantasy-gold mx-auto flex items-center justify-center text-2xl shadow-gold-glow animate-pulse">
            🔥
          </div>
          <h2 className="font-cinzel text-fantasy-gold text-2xl font-black">
            Perkemahan Api Unggun (Campfire Rest)
          </h2>
          <p className="text-slate-200 text-xs sm:text-sm italic font-serif">
            "{restLog}"
          </p>
        </div>
      </div>

      {/* Rest Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Short Rest Card */}
        <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-cinzel font-bold text-sm">
              <Coffee size={18} /> Short Rest (Istirahat 1 Jam)
            </div>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Membalut luka ringan dan minum air untuk memulihkan sebagian Hit Points (1 Hit Die + CON mod).
            </p>
          </div>

          <button
            type="button"
            onClick={handleShortRest}
            disabled={resting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-300 font-cinzel font-bold text-xs uppercase py-2.5 rounded-xl border border-amber-500/40 shadow-sm transition-all disabled:opacity-40"
          >
            {resting ? 'Sedang Beristirahat...' : 'Lakukan Short Rest ☕'}
          </button>
        </div>

        {/* Long Rest Card */}
        <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-300 font-cinzel font-bold text-sm">
              <Moon size={18} /> Long Rest (Tidur 8 Jam Penuh)
            </div>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Tidur semalaman penuh untuk memulihkan seluruh Hit Points (100% HP) dan menyegarkan kembali semua Slot Mantra sihir.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLongRest}
            disabled={resting}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase py-2.5 rounded-xl shadow-gold-glow transition-all disabled:opacity-40"
          >
            {resting ? 'Sedang Tidur Nyenyak...' : 'Lakukan Long Rest 🌙'}
          </button>
        </div>
      </div>
    </div>
  );
};
