import React, { useState } from 'react';
import { Skull, Plus, Trash2, Shield, Heart, Zap, Award } from 'lucide-react';

export const MonsterCreator = ({ customMonsters = [], onChangeCustomMonsters }) => {
  const [monsters, setMonsters] = useState(customMonsters);
  const [name, setName] = useState('');
  const [type, setType] = useState('Monster Unik');
  const [cr, setCr] = useState('1');
  const [hp, setHp] = useState(15);
  const [ac, setAc] = useState(13);
  const [attackName, setAttackName] = useState('Cakaran Bayangan');
  const [damageDice, setDamageDice] = useState('1d8+2');
  const [icon, setIcon] = useState('👾');

  const handleAddMonster = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMonster = {
      id: `custom_m_${Date.now()}`,
      name,
      type,
      cr,
      maxHp: parseInt(hp, 10) || 15,
      currentHp: parseInt(hp, 10) || 15,
      armorClass: parseInt(ac, 10) || 13,
      attackName,
      damageDice,
      icon,
      expReward: parseInt(cr, 10) * 150 || 100,
      goldReward: parseInt(cr, 10) * 15 || 10,
    };

    const updated = [newMonster, ...monsters];
    setMonsters(updated);
    onChangeCustomMonsters(updated);

    setName('');
    setAttackName('Cakaran Bayangan');
  };

  const handleDelete = (id) => {
    const updated = monsters.filter(m => m.id !== id);
    setMonsters(updated);
    onChangeCustomMonsters(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Creation Form */}
      <form onSubmit={handleAddMonster} className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-3.5">
        <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5 pb-2 border-b border-slate-800">
          <Skull size={16} /> Tempa Monster & NPC Kustom
        </h4>

        <div>
          <label className="text-[11px] text-slate-400 font-semibold block mb-1">Nama Monster / Bos:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Kultis Bayangan Kegelapan"
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Challenge Rating (CR):</label>
            <select
              value={cr}
              onChange={(e) => setCr(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
            >
              <option value="1/4">CR 1/4 (Mudah)</option>
              <option value="1/2">CR 1/2 (Sedang)</option>
              <option value="1">CR 1 (Kuat)</option>
              <option value="2">CR 2 (Elit)</option>
              <option value="3">CR 3 (Bos)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Ikon Emoji:</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-center text-slate-100 focus:outline-none focus:border-fantasy-gold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Hit Points (HP):</label>
            <input
              type="number"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Armor Class (AC):</label>
            <input
              type="number"
              value={ac}
              onChange={(e) => setAc(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 font-semibold block mb-1">Nama Serangan Utama:</label>
          <input
            type="text"
            value={attackName}
            onChange={(e) => setAttackName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase py-2.5 rounded-xl shadow-gold-glow flex items-center justify-center gap-1.5 transition-all mt-2"
        >
          <Plus size={14} /> Simpan Monster ke Campaign
        </button>
      </form>

      {/* Monster List */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
        <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5 pb-2 border-b border-slate-800">
          <Award size={16} /> Daftar Monster Kustom Campaign ({monsters.length})
        </h4>

        {monsters.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 italic">
            Belum ada monster kustom. Gunakan formulir di sebelah kiri untuk membuat monster baru.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {monsters.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex justify-between items-start"
              >
                <div className="flex gap-3">
                  <span className="text-3xl">{m.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{m.name}</div>
                    <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                      CR {m.cr} • {m.maxHp} HP • AC {m.armorClass}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      ⚔️ {m.attackName} ({m.damageDice})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
