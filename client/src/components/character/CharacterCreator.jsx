import React, { useState } from 'react';
import { Shield, Heart, Zap, Sparkles, ChevronRight, Check, Dice5, User } from 'lucide-react';

const RACES = [
  { name: 'Manusia (Human)', bonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 }, speed: 30, desc: 'Ambisius, serba bisa, dan cepat beradaptasi di segala medan.' },
  { name: 'Elf', bonuses: { dexterity: 2 }, speed: 30, desc: 'Makhluk anggun berumur panjang dengan kepekaan sihir alam dan penglihatan malam.' },
  { name: 'Dwarf', bonuses: { constitution: 2 }, speed: 25, desc: 'Petarung tangguh dan tahan racun yang ditempa di dalam tambang pegunungan batu.' },
  { name: 'Dragonborn', bonuses: { strength: 2, charisma: 1 }, speed: 30, desc: 'Keturunan naga purba yang berwibawa dan mampu menghembuskan nafas elemen kehancuran.' },
  { name: 'Tiefling', bonuses: { charisma: 2, intelligence: 1 }, speed: 30, desc: 'Memiliki warisan darah iblis kuno dengan bakat sihir api dan tatapan mengintimidasi.' },
  { name: 'Halfling', bonuses: { dexterity: 2 }, speed: 25, desc: 'Tubuh mungil yang sangat lincah, berani, dan diberkati keberuntungan alami.' }
];

const CLASSES = [
  { name: 'Fighter (Pendekar)', hitDie: 10, primary: 'Strength', armorProf: 'Semua Armor & Perisai', desc: 'Ahli tempur senjata jarak dekat, ahli taktik perang berdisiplin tinggi.' },
  { name: 'Wizard (Penyihir)', hitDie: 6, primary: 'Intelligence', armorProf: 'Tanpa Armor', desc: 'Sarjana sihir misterius yang mempelajari mantra kuno pengubah realitas.' },
  { name: 'Rogue (Pengelana Bayangan)', hitDie: 8, primary: 'Dexterity', armorProf: 'Armor Ringan', desc: 'Ahli menyusup, membobol kunci, dan melancarkan serangan mematikan dari bayangan (Sneak Attack).' },
  { name: 'Cleric (Pendeta Suci)', hitDie: 8, primary: 'Wisdom', armorProf: 'Armor Sedang & Perisai', desc: 'Pengabdi dewa agung yang dianugerahi mukjizat penyembuh dan penghukum kejahatan.' },
  { name: 'Paladin (Ksatria Suci)', hitDie: 10, primary: 'Strength & Charisma', armorProf: 'Semua Armor & Perisai', desc: 'Ksatria pembawa sumpah suci yang memadukan keahlian pedang dengan sihir keadilan.' },
  { name: 'Barbarian (Petarung Liar)', hitDie: 12, primary: 'Strength & Constitution', armorProf: 'Armor Ringan/Sedang', desc: 'Pejuang primal liar berdaya tahan luar biasa yang mengamuk dalam pertempuran (Rage).' }
];

const BACKGROUNDS = ['Prajurit Kerajaan (Soldier)', 'Pelayan Kuil (Acolyte)', 'Buronan Kriminal (Criminal)', 'Cendekiawan (Sage)', 'Bangsawan (Noble)', 'Pahlawan Desa (Folk Hero)', 'Penjelajah Rimba (Outlander)'];
const ALIGNMENTS = [
  'Lawful Good (Tertib Baik)', 'Neutral Good (Netral Baik)', 'Chaotic Good (Bebas Baik)',
  'Lawful Neutral (Tertib Netral)', 'True Neutral (Netral Sejati)', 'Chaotic Neutral (Bebas Netral)',
  'Lawful Evil (Tertib Jahat)', 'Neutral Evil (Netral Jahat)', 'Chaotic Evil (Bebas Jahat)'
];

export const CharacterCreator = ({ onCreated, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [selectedRace, setSelectedRace] = useState(RACES[0]);
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [background, setBackground] = useState(BACKGROUNDS[0]);
  const [alignment, setAlignment] = useState(ALIGNMENTS[1]);
  const [bio, setBio] = useState('');

  const [scores, setScores] = useState({
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8,
  });

  const getFinalScore = (stat) => {
    const bonus = selectedRace.bonuses[stat] || 0;
    return scores[stat] + bonus;
  };

  const calcMod = (val) => Math.floor((val - 10) / 2);
  const formatMod = (val) => {
    const m = calcMod(val);
    return m >= 0 ? `+${m}` : `${m}`;
  };

  const finalCon = getFinalScore('constitution');
  const finalHp = Math.max(1, selectedClass.hitDie + calcMod(finalCon));
  const finalDex = getFinalScore('dexterity');
  const finalAc = 10 + calcMod(finalDex);

  const handleScoreChange = (stat, value) => {
    const parsed = Math.min(20, Math.max(1, parseInt(value, 10) || 8));
    setScores(prev => ({ ...prev, [stat]: parsed }));
  };

  const handleRollRandomScores = () => {
    const rollStat = () => {
      const rolls = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => a - b);
      return rolls[1] + rolls[2] + rolls[3];
    };
    setScores({
      strength: rollStat(),
      dexterity: rollStat(),
      constitution: rollStat(),
      intelligence: rollStat(),
      wisdom: rollStat(),
      charisma: rollStat(),
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Harap masukkan nama karakter pahlawanmu!');
      setStep(1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        race: selectedRace.name.split(' (')[0],
        characterClass: selectedClass.name.split(' (')[0],
        background,
        alignment,
        bio,
        strength: getFinalScore('strength'),
        dexterity: getFinalScore('dexterity'),
        constitution: getFinalScore('constitution'),
        intelligence: getFinalScore('intelligence'),
        wisdom: getFinalScore('wisdom'),
        charisma: getFinalScore('charisma'),
        speed: selectedRace.speed,
      };

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        if (onCreated) onCreated(data.data);
      } else {
        setError(data.message || 'Gagal menyimpan karakter ke database.');
      }
    } catch (err) {
      setError('Terjadi kendala jaringan saat menyimpan karakter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto border border-fantasy-border shadow-2xl">
      {/* Header Wizard Steps */}
      <div className="flex flex-wrap justify-between items-center pb-5 mb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="font-cinzel text-fantasy-gold text-2xl font-bold tracking-wide">Tempa Karakter Baru</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Buat pahlawan D&D 5E siap tempur untuk memulai petualangan</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: 'Identitas & Ras' },
            { num: 2, label: 'Atribut Stat' },
            { num: 3, label: 'Latar Belakang' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`w-8 h-8 rounded-full font-cinzel font-bold text-xs flex items-center justify-center transition-all ${
                step === s.num
                  ? 'bg-fantasy-gold text-slate-950 ring-2 ring-fantasy-gold/50 shadow-gold-glow'
                  : step > s.num
                  ? 'bg-amber-950/70 text-fantasy-gold border border-fantasy-gold/40'
                  : 'bg-slate-800/60 text-slate-500 border border-slate-700/50'
              }`}
            >
              {step > s.num ? <Check size={14} /> : s.num}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/70 border border-rose-600/70 text-rose-300 px-4 py-3 rounded-lg text-sm mb-5 flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* STEP 1: IDENTITY & RACE/CLASS */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-cinzel font-bold text-fantasy-gold uppercase tracking-wider mb-2">
              Nama Pahlawan / Petualang
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Valthex Shadowveil, Roland Sang Penjelajah"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fantasy-gold focus:ring-1 focus:ring-fantasy-gold transition-all text-base"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Race Selection */}
            <div>
              <label className="block text-xs font-cinzel font-bold text-fantasy-gold uppercase tracking-wider mb-2">
                Pilih Ras Karakter
              </label>
              <div className="grid grid-cols-2 gap-2">
                {RACES.map((r) => (
                  <div
                    key={r.name}
                    onClick={() => setSelectedRace(r)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedRace.name === r.name
                        ? 'bg-fantasy-gold/15 border-fantasy-gold text-fantasy-gold shadow-md'
                        : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-semibold text-sm">{r.name.split(' (')[0]}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Kecepatan: {r.speed} kaki</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 italic mt-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/70">
                "{selectedRace.desc}"
              </p>
            </div>

            {/* Class Selection */}
            <div>
              <label className="block text-xs font-cinzel font-bold text-fantasy-gold uppercase tracking-wider mb-2">
                Pilih Kelas (Class)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CLASSES.map((c) => (
                  <div
                    key={c.name}
                    onClick={() => setSelectedClass(c)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedClass.name === c.name
                        ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-md'
                        : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-semibold text-sm">{c.name.split(' (')[0]}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Hit Die: d{c.hitDie}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 italic mt-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/70">
                "{selectedClass.desc}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ABILITY SCORES */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h4 className="font-cinzel text-fantasy-gold font-bold text-base">Kalkulator Atribut D&D 5E</h4>
              <p className="text-xs text-slate-400">Atur angka dasar atau acak dengan lemparan dadu resmi (4d6 drop lowest)</p>
            </div>
            <button
              type="button"
              onClick={handleRollRandomScores}
              className="bg-slate-800 hover:bg-slate-700 text-fantasy-gold text-xs font-cinzel font-bold py-1.5 px-3 rounded-lg border border-fantasy-border flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Dice5 size={14} /> Acak Stat (4d6 Drop Lowest)
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { id: 'strength', label: 'STR (Kekuatan)' },
              { id: 'dexterity', label: 'DEX (Kelincahan)' },
              { id: 'constitution', label: 'CON (Daya Tahan)' },
              { id: 'intelligence', label: 'INT (Kecerdasan)' },
              { id: 'wisdom', label: 'WIS (Kebijaksanaan)' },
              { id: 'charisma', label: 'CHA (Kharisma)' },
            ].map(({ id, label }) => {
              const finalVal = getFinalScore(id);
              const bonus = selectedRace.bonuses[id] || 0;
              return (
                <div
                  key={id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label.split(' ')[0]}</div>
                  <input
                    type="number"
                    value={scores[id]}
                    onChange={(e) => handleScoreChange(id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg text-center font-bold text-lg text-slate-100 py-1 my-1.5 focus:outline-none focus:border-fantasy-gold"
                  />
                  {bonus > 0 && (
                    <div className="text-[10px] text-emerald-400 font-medium">+{bonus} Ras</div>
                  )}
                  <div className={`text-sm font-bold font-cinzel mt-1 ${
                    calcMod(finalVal) >= 0 ? 'text-fantasy-gold' : 'text-rose-400'
                  }`}>
                    Mod: {formatMod(finalVal)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Derived Combat Preview */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 text-center">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">MAKSIMUM HP</div>
              <div className="text-2xl font-black font-cinzel text-rose-400">{finalHp}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">d{selectedClass.hitDie} + MOD CON</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">ARMOR CLASS (AC)</div>
              <div className="text-2xl font-black font-cinzel text-sky-400">{finalAc}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">10 + MOD DEX</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">KECEPATAN</div>
              <div className="text-2xl font-black font-cinzel text-emerald-400">{selectedRace.speed} kaki</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Langkah Normal</div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: BACKGROUND & CONFIRMATION */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-cinzel font-bold text-fantasy-gold uppercase tracking-wider mb-2">
                Latar Belakang (Background)
              </label>
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-fantasy-gold"
              >
                {BACKGROUNDS.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-slate-100">{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-cinzel font-bold text-fantasy-gold uppercase tracking-wider mb-2">
                Pilar Moral (Alignment)
              </label>
              <select
                value={alignment}
                onChange={(e) => setAlignment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-fantasy-gold"
              >
                {ALIGNMENTS.map((a) => (
                  <option key={a} value={a} className="bg-slate-900 text-slate-100">{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-cinzel font-bold text-fantasy-gold uppercase tracking-wider mb-2">
              Kisah Singkat & Motivasi Karakter
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan asal-usul pahlawanmu, sumpah yang dipegang teguh, atau rahasia yang ia bawa..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fantasy-gold"
            />
          </div>

          <div className="bg-amber-950/20 border border-fantasy-border p-4 rounded-xl">
            <h5 className="font-cinzel text-fantasy-gold font-bold text-sm mb-1">Ringkasan Konfirmasi Karakter</h5>
            <div className="text-sm font-semibold text-slate-200">
              {name || 'Petualang Tanpa Nama'} — Level 1 {selectedRace.name.split(' (')[0]} {selectedClass.name.split(' (')[0]}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              HP: {finalHp} | AC: {finalAc} | STR: {getFinalScore('strength')} | DEX: {getFinalScore('dexterity')} | CON: {getFinalScore('constitution')} | INT: {getFinalScore('intelligence')} | WIS: {getFinalScore('wisdom')} | CHA: {getFinalScore('charisma')}
            </div>
          </div>
        </div>
      )}

      {/* Wizard Action Footer */}
      <div className="flex justify-between items-center mt-8 pt-5 border-t border-slate-800">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-all"
          >
            ← Kembali
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-rose-400 hover:text-rose-300 text-sm font-medium transition-all"
          >
            Batal
          </button>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="bg-slate-800 hover:bg-slate-700 text-fantasy-gold font-cinzel font-bold text-xs uppercase px-5 py-2.5 rounded-xl border border-fantasy-border flex items-center gap-1.5 transition-all shadow-md"
          >
            Lanjut <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-gold-glow flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Menyimpan ke Database...' : 'Selesaikan & Tempa Karakter ⚔️'}
          </button>
        )}
      </div>
    </div>
  );
};
