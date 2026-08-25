import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Edit3, Bookmark } from 'lucide-react';

export const LorebookEditor = ({ lorebook = [], onChangeLorebook }) => {
  const [selectedLore, setSelectedLore] = useState(lorebook[0] || null);

  const handleAddLore = () => {
    const newLore = {
      id: `lore_${Date.now()}`,
      topic: 'Topik Dunia Baru',
      content: 'Tuliskan sejarah, hukum sihir, atau rahasia faksi di sini...',
    };
    const updated = [...lorebook, newLore];
    onChangeLorebook(updated);
    setSelectedLore(newLore);
  };

  const handleUpdate = (field, val) => {
    if (!selectedLore) return;
    const updated = { ...selectedLore, [field]: val };
    setSelectedLore(updated);
    onChangeLorebook(lorebook.map(l => l.id === updated.id ? updated : l));
  };

  const handleDelete = (id) => {
    const updated = lorebook.filter(l => l.id !== id);
    onChangeLorebook(updated);
    setSelectedLore(updated[0] || null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lore List */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div>
            <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5">
              <BookOpen size={16} /> Ensiklopedia & Lore Dunia
            </h4>
            <span className="text-[10px] text-slate-400">Memori pengetahuan untuk AI DM</span>
          </div>

          <button
            type="button"
            onClick={handleAddLore}
            className="bg-fantasy-gold hover:bg-amber-400 text-slate-950 font-cinzel font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
          >
            <Plus size={14} /> Tambah Lore
          </button>
        </div>

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {lorebook.map((lore) => (
            <div
              key={lore.id}
              onClick={() => setSelectedLore(lore)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                selectedLore?.id === lore.id
                  ? 'bg-amber-950/40 border-fantasy-gold shadow-gold-glow'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bookmark size={15} className="text-fantasy-gold" />
                <span className="text-xs font-bold text-slate-200">{lore.topic}</span>
              </div>

              {lorebook.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(lore.id);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lore Content Form */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
        <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5 pb-2 border-b border-slate-800">
          <Edit3 size={15} /> Edit Catatan Pengetahuan
        </h4>

        {selectedLore ? (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Nama Subjek / Entri Ensiklopedia:</label>
              <input
                type="text"
                value={selectedLore.topic}
                onChange={(e) => handleUpdate('topic', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Uraian Sejarah, Fakta & Lore Lengkap:</label>
              <textarea
                rows={9}
                value={selectedLore.content}
                onChange={(e) => handleUpdate('content', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold leading-relaxed"
                placeholder="Tuliskan latar belakang sejarah yang akan dipahami AI..."
              />
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-500 italic">
            Pilih entri ensiklopedia untuk melihat detail.
          </div>
        )}
      </div>
    </div>
  );
};
