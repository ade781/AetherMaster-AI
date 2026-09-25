import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, Terminal } from 'lucide-react';
import audio from '../../services/audioService';

export default function PromptStudioModal({ isOpen, onClose, showToast }) {
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const prompts = [
    {
      id: 'dm_core',
      title: 'Master Prompt: Dungeon Master 5E Server-Authoritative',
      category: 'Sistem Inti',
      text: `Kamu adalah Dungeon Master D&D 5E profesional dan penulis narasi sinematik AetherMaster AI.
Aturan Mutlak:
1. Evaluasi setiap aksi pemain secara logis dengan aturan D&D 5E (DC 10-25, Ability Check STR/DEX/CON/INT/WIS/CHA).
2. Jangan pernah mendikte keputusan pemain sebelumnya; berikan konsekuensi dinamis atas pilihan mereka.
3. Selalu format respons dalam skema JSON terstruktur: { speaker, dialogueText, consequenceNote, mood, backgroundId, choices: [{ text, tone, statType, dc, requiredItem }] }.
4. Sajikan narasi gelap, mendalam, dan atmosferik berbahasa Indonesia.`
    },
    {
      id: 'combat_encounter',
      title: 'Prompt Taktis: Encounter Monster & Battle Turn',
      category: 'Pertempuran Taktis',
      text: `Buat adegan pertemuan musuh taktis D&D 5E.
Tentukan:
- Nama Monster & Sprite ID (monster_01_skeleton s.d monster_09_drake)
- Armor Class (AC 12 - 18) dan Max HP (15 - 80)
- Tiga serangan taktis musuh beserta bonus serangan dan dadu damage
- Evaluasi ronde giliran berdasarkan lemparan D20 Attack Roll vs Target AC.`
    },
    {
      id: 'branching_consequence',
      title: 'Prompt Narasi Cabang: Logika Konsekuensi Nyata',
      category: 'Percabangan',
      text: `Tinjau riwayat keputusan pemain di sesi saat ini.
Bila pemain gagal dalam uji ketangkasan (DEX check vs DC 15) di koridor jebakan:
- Berikan damage fisik realistis (-1d6 HP).
- Ubah deskripsi ruangan menjadi rusak atau waspada.
- Hadirkan 3 pilihan baru: pertolongan darurat, jalur alternatif, atau mundur teratur.`
    }
  ];

  const handleCopy = (p) => {
    navigator.clipboard.writeText(p.text);
    setCopiedId(p.id);
    audio.playClick();
    if (showToast) showToast(`Prompt "${p.title}" disalin ke clipboard!`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          aria-label="Tutup jendela modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-white">Prompt Studio &amp; Katalog D&amp;D Master</h3>
            <p className="text-xs text-slate-400">Koleksi master prompt arsitektur Dungeon Master AetherMaster</p>
          </div>
        </div>

        <div className="space-y-4">
          {prompts.map((p) => {
            const isCopied = copiedId === p.id;
            return (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      {p.category}
                    </span>
                    <h4 className="text-xs md:text-sm font-semibold text-white">{p.title}</h4>
                  </div>
                  <button
                    onClick={() => handleCopy(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                      isCopied
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isCopied ? 'Tersalin' : 'Salin Prompt'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-850 whitespace-pre-wrap leading-relaxed">
                  {p.text}
                </pre>
              </div>
            );
          })}
        </div>

        <div className="pt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
          >
            Tutup Studio
          </button>
        </div>
      </div>
    </div>
  );
}
