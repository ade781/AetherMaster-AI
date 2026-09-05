import React, { useState } from 'react';
import { ChevronRight, Check, Dice5, User, Swords, Zap, ArrowLeft } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

const RACES = [
  { name: 'Manusia (Human)', bonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 }, speed: 30, desc: 'Ambisius, serba bisa, dan cepat beradaptasi di segala medan.' },
  { name: 'Elf', bonuses: { dexterity: 2 }, speed: 30, desc: 'Makhluk anggun berumur panjang dengan kepekaan sihir alam dan penglihatan malam.' },
  { name: 'Dwarf', bonuses: { constitution: 2 }, speed: 25, desc: 'Petarung tangguh dan tahan racun yang ditempa di dalam tambang pegunungan batu.' },
  { name: 'Dragonborn', bonuses: { strength: 2, charisma: 1 }, speed: 30, desc: 'Keturunan naga purba yang berwibawa dan mampu menghembuskan nafas elemen kehancuran.' },
  { name: 'Tiefling', bonuses: { charisma: 2, intelligence: 1 }, speed: 30, desc: 'Memiliki warisan darah iblis kuno dengan bakat sihir api dan tatapan mengintimidasi.' },
  { name: 'Halfling', bonuses: { dexterity: 2 }, speed: 25, desc: 'Tubuh mungil yang sangat lincah, berani, dan diberkati keberuntungan alami.' }
];

const CLASSES = [
  { name: 'Fighter (Pendekar)', hitDie: 10, primary: 'Strength', desc: 'Ahli tempur senjata jarak dekat, ahli taktik perang berdisiplin tinggi.' },
  { name: 'Wizard (Penyihir)', hitDie: 6, primary: 'Intelligence', desc: 'Sarjana sihir misterius yang mempelajari mantra kuno pengubah realitas.' },
  { name: 'Rogue (Pengelana Bayangan)', hitDie: 8, primary: 'Dexterity', desc: 'Ahli menyusup, membobol kunci, dan melancarkan serangan mematikan dari bayangan.' },
  { name: 'Cleric (Pendeta Suci)', hitDie: 8, primary: 'Wisdom', desc: 'Pengabdi dewa agung yang dianugerahi mukjizat penyembuh dan penghukum kejahatan.' },
  { name: 'Paladin (Ksatria Suci)', hitDie: 10, primary: 'Strength & Charisma', desc: 'Ksatria pembawa sumpah suci yang memadukan keahlian pedang dengan sihir keadilan.' },
  { name: 'Barbarian (Petarung Liar)', hitDie: 12, primary: 'Strength & Constitution', desc: 'Pejuang primal liar berdaya tahan luar biasa yang mengamuk dalam pertempuran.' }
];

const BACKGROUNDS = ['Prajurit Kerajaan (Soldier)', 'Pelayan Kuil (Acolyte)', 'Buronan Kriminal (Criminal)', 'Cendekiawan (Sage)', 'Bangsawan (Noble)', 'Pahlawan Desa (Folk Hero)', 'Penjelajah Rimba (Outlander)'];
const ALIGNMENTS = [
  'Lawful Good (Tertib Baik)', 'Neutral Good (Netral Baik)', 'Chaotic Good (Bebas Baik)',
  'Lawful Neutral (Tertib Netral)', 'True Neutral (Netral Sejati)', 'Chaotic Neutral (Bebas Netral)',
  'Lawful Evil (Tertib Jahat)', 'Neutral Evil (Netral Jahat)', 'Chaotic Evil (Bebas Jahat)'
];

export const CharacterCreator = ({ onCreated, isFirstTime = false, onCancel }) => {
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

  // Roll 4d6 drop lowest
  const roll4d6DropLowest = () => {
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    return rolls.slice(1).reduce((sum, val) => sum + val, 0);
  };

  const handleRandomizeStats = () => {
    audioEngine.playDiceRoll();
    setScores({
      strength: roll4d6DropLowest(),
      dexterity: roll4d6DropLowest(),
      constitution: roll4d6DropLowest(),
      intelligence: roll4d6DropLowest(),
      wisdom: roll4d6DropLowest(),
      charisma: roll4d6DropLowest(),
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Nama karakter pahlawan wajib diisi!');
      setStep(1);
      return;
    }

    setLoading(true);
    setError('');

    const finalStrength = getFinalScore('strength');
    const finalDexterity = getFinalScore('dexterity');
    const finalConstitution = getFinalScore('constitution');
    const finalIntelligence = getFinalScore('intelligence');
    const finalWisdom = getFinalScore('wisdom');
    const finalCharisma = getFinalScore('charisma');

    const conMod = calcMod(finalConstitution);
    const calculatedMaxHp = Math.max(1, selectedClass.hitDie + conMod);
    const dexMod = calcMod(finalDexterity);
    const calculatedAc = 10 + dexMod;

    const payload = {
      name,
      race: selectedRace.name.split(' (')[0],
      characterClass: selectedClass.name.split(' (')[0],
      background,
      alignment,
      strength: finalStrength,
      dexterity: finalDexterity,
      constitution: finalConstitution,
      intelligence: finalIntelligence,
      wisdom: finalWisdom,
      charisma: finalCharisma,
      maxHp: calculatedMaxHp,
      currentHp: calculatedMaxHp,
      baseArmorClass: calculatedAc,
      armorClass: calculatedAc,
      speed: selectedRace.speed,
      bio,
    };

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        audioEngine.playSpellCast();
        onCreated(data.data);
      } else {
        setError(data.message || 'Gagal menyimpan karakter');
      }
    } catch (err) {
      setError('Gagal menghubungi server database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Wizard Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-fantasy-border shadow-2xl text-center space-y-2">
        <span className="text-xs text-fantasy-gold font-bold uppercase tracking-widest">
          {isFirstTime ? 'LANGKAH 1 DARI 2: INISIALISASI PETUALANG' : 'STUDIO PENEMPAAN KARAKTER'}
        </span>
        <h2 className="font-cinzel text-fantasy-gold text-2xl sm:text-3xl font-black">
          {isFirstTime ? 'Tempa Pahlawan Pertamamu' : 'Buat Karakter Pahlawan Baru'}
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          Sebelum memulai petualangan, tentukan identitas, ras, kelas tempur, dan skor kemampuan dasar pahlawanmu.
        </p>

        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-3 pt-3">
          {[
            { num: 1, label: 'Identitas & Ras' },
            { num: 2, label: 'Kelas & Profesi' },
            { num: 3, label: 'Stat Atribut' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(s.num)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-cinzel transition-all ${
                  step === s.num
                    ? 'bg-fantasy-gold text-slate-950 shadow-gold-glow scale-110'
                    : step > s.num
                    ? 'bg-amber-950 text-amber-300 border border-fantasy-gold/50'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </button>
              <span className={`text-[11px] font-medium hidden sm:inline ${step === s.num ? 'text-fantasy-gold font-bold' : 'text-slate-500'}`}>
                {s.label}
              </span>
              {s.num < 3 && <span className="text-slate-700 hidden sm:inline">—</span>}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/80 border border-rose-600 text-rose-300 px-4 py-3 rounded-xl text-center font-semibold text-xs shadow-md">
          ⚠️ {error}
        </div>
      )}

      {/* STEP 1: Name, Race, Background */}
      {step === 1 && (
        <div className="glass-card rounded-2xl p-6 border border-fantasy-border space-y-5">
          <h3 className="font-cinzel text-fantasy-gold font-bold text-base flex items-center gap-2 pb-2 border-b border-slate-800">
            <User size={18} /> 1. Identitas & Asal-Usul Ras
          </h3>

          <div>
            <label className="text-xs text-slate-300 font-bold block mb-1.5">
              Nama Lengkap Pahlawan <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Valerius Sang Penjaga Cahaya"
              required
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fantasy-gold font-medium"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-bold block mb-2">Pilih Ras Karakter:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RACES.map((race) => (
                <div
                  key={race.name}
                  onClick={() => setSelectedRace(race)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedRace.name === race.name
                      ? 'bg-amber-950/40 border-fantasy-gold shadow-gold-glow'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-cinzel font-bold text-xs text-slate-100">{race.name}</span>
                    <span className="text-[10px] text-amber-400 font-semibold">{race.speed}ft</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{race.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1.5">Latar Belakang (Background):</label>
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-fantasy-gold"
              >
                {BACKGROUNDS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1.5">Pandangan Moral (Alignment):</label>
              <select
                value={alignment}
                onChange={(e) => setAlignment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-fantasy-gold"
              >
                {ALIGNMENTS.map((al) => (
                  <option key={al} value={al}>{al}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={() => {
                if (!name.trim()) {
                  setError('Silakan masukkan nama pahlawan terlebih dahulu!');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase px-6 py-2.5 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-all"
            >
              Lanjut: Pilih Kelas <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Class Selection */}
      {step === 2 && (
        <div className="glass-card rounded-2xl p-6 border border-fantasy-border space-y-5">
          <h3 className="font-cinzel text-fantasy-gold font-bold text-base flex items-center gap-2 pb-2 border-b border-slate-800">
            <Swords size={18} /> 2. Pilih Kelas Pertempuran & Spesialisasi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {CLASSES.map((cls) => (
              <div
                key={cls.name}
                onClick={() => setSelectedClass(cls)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedClass.name === cls.name
                    ? 'bg-amber-950/40 border-fantasy-gold shadow-gold-glow'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-cinzel font-bold text-sm text-slate-100">{cls.name}</span>
                    <span className="text-[10px] bg-rose-950/80 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                      Hit Die: d{cls.hitDie}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cls.desc}</p>
                </div>
                <div className="text-[10px] text-amber-400 font-semibold mt-3">
                  Atribut Utama: {cls.primary}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-cinzel font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft size={16} /> Kembali
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase px-6 py-2.5 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-all"
            >
              Lanjut: Tentukan Atribut <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Ability Scores & Confirmation */}
      {step === 3 && (
        <div className="glass-card rounded-2xl p-6 border border-fantasy-border space-y-5">
          <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-800 gap-2">
            <h3 className="font-cinzel text-fantasy-gold font-bold text-base flex items-center gap-2">
              <Zap size={18} /> 3. Skor Atribut Kemampuan D&D 5E
            </h3>
            <button
              type="button"
              onClick={handleRandomizeStats}
              className="bg-slate-800 hover:bg-slate-700 text-fantasy-gold font-cinzel font-bold text-xs px-3.5 py-1.5 rounded-xl border border-fantasy-gold/40 flex items-center gap-1.5 transition-all"
            >
              <Dice5 size={14} /> Acak Dadu (4d6 Drop Lowest)
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'strength', label: 'Strength (STR)', desc: 'Kekuatan fisik' },
              { key: 'dexterity', label: 'Dexterity (DEX)', desc: 'Kelincahan & refleks' },
              { key: 'constitution', label: 'Constitution (CON)', desc: 'Daya tahan tubuh' },
              { key: 'intelligence', label: 'Intelligence (INT)', desc: 'Pengetahuan sihir' },
              { key: 'wisdom', label: 'Wisdom (WIS)', desc: 'Kepekaan & persepsi' },
              { key: 'charisma', label: 'Charisma (CHA)', desc: 'Wibawa & persuasi' },
            ].map((st) => {
              const base = scores[st.key];
              const bonus = selectedRace.bonuses[st.key] || 0;
              const finalVal = base + bonus;
              return (
                <div key={st.key} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{st.label}</div>
                  <div className="text-xl font-black font-cinzel text-fantasy-gold mt-1">
                    {finalVal} <small className="text-xs text-amber-300 font-normal">({formatMod(finalVal)})</small>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Basis: {base} {bonus > 0 && `+ Ras ${bonus}`}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="text-xs text-slate-300 font-bold block mb-1.5">Kisah Singkat / Bio Pahlawan (Opsional):</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan motivasi atau sumpah yang dipegang pahlawanmu..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold leading-relaxed"
            />
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-cinzel font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft size={16} /> Kembali
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-cinzel font-bold text-xs uppercase px-8 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Check size={18} /> {loading ? 'Menempa Pahlawan...' : 'Selesaikan & Mulai Petualangan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
