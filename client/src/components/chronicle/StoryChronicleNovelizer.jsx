import React, { useState } from 'react';
import { BookOpen, Download, Printer, Feather } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

export const StoryChronicleNovelizer = ({ character, story }) => {
  const [novelTitle, setNovelTitle] = useState(`Babad Epik ${character.name}: Rahasia di ${story?.title || 'Makam Kuno'}`);
  const [novelContent, setNovelContent] = useState(`BAB I: PANGGILAN TAKDIR DARI KEGELAPAN

Hembusan angin malam menyapu dinginnya pelataran batu berlumut. Di bawah naungan langit berbintang kelabu, seorang petualang bernama ${character.name}, seorang ${character.race} ${character.characterClass} yang telah bersumpah menempuh jalan bahaya, melangkahkan kakinya menembus gerbang reruntuhan kuno.

"Setiap langkah di tempat ini adalah taruhan nyawa," bisik suara batin sang pahlawan seraya meraba gagang senjatanya.

Di hadapannya membentang koridor gelap berdinding pualam retak peninggalan dinasti masa lampau. Jejak pertempuran purba masih tertinggal di permukaan batu—torehan cakar naga dan abu sihir yang tak kunjung padam. Tanpa keraguan, ${character.name} menyalakan obor minyak dan melangkah masuk ke dalam kegelapan, bersiap menghadapi jebakan mematikan dan monster penjaga yang menanti di balik bayang-bayang.

BAB II: UJIAN DARAH DAN KELINCAHAN

Suara desis perangkap memecah keheningan gua saat lantai batu bergeser beberapa inci. Dengan refleks terlatih, sang pahlawan melompat menghindar ketika anak panah berlapis racun meluncur membelah udara. Bau belerang tercium pekat dari ruang bawah tanah, menandakan sarang makhluk purba kian dekat. Pertarungan demi pertarungan ia lewati demi menyingkap rahasia terkutuk yang tersimpan berabad-abad...`);

  // Download Novel as Text File (Ponytail native client-side exporter)
  const handleDownloadText = () => {
    audioEngine.playCoinDrop();
    const element = document.createElement('a');
    const file = new Blob([`${novelTitle}\n\nPenulis: AetherMaster AI Chronicler\nPahlawan Utama: ${character.name}\n\n${novelContent}`], {
      type: 'text/plain;charset=utf-8'
    });
    element.href = URL.createObjectURL(file);
    element.download = `${novelTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    element.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-fantasy-gold flex items-center justify-center text-2xl shadow-gold-glow">
            📜
          </div>
          <div>
            <h2 className="font-cinzel text-fantasy-gold text-xl font-bold flex items-center gap-2">
              Buku Naskah Petualangan (Story Chronicle Novelizer)
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Otomatis merangkum seluruh perjalanan dan pertempuran pahlawan menjadi bab novel sastra fantasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-cinzel font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Printer size={14} /> Cetak Naskah
          </button>
          <button
            type="button"
            onClick={handleDownloadText}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase px-4 py-2 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-all"
          >
            <Download size={14} /> Download Novel (.txt)
          </button>
        </div>
      </div>

      {/* Manuscript Viewer Page */}
      <div className="bg-amber-50/95 text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl border-4 border-amber-950/40 max-w-3xl mx-auto space-y-6 font-serif">
        <div className="text-center border-b-2 border-amber-900/30 pb-6 space-y-2">
          <div className="text-amber-800 text-xs uppercase tracking-widest font-sans font-bold flex items-center justify-center gap-1.5">
            <Feather size={14} /> KRONIK SEJARAH DUNIA AETHERIA
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-black text-amber-950 tracking-wide">
            {novelTitle}
          </h1>
          <p className="text-xs text-amber-800 italic">
            Dikisahkan untuk Mengabadikan Langkah Pahlawan: <strong>{character.name}</strong> (Tingkat {character.level} {character.race} {character.characterClass})
          </p>
        </div>

        {/* Novel Text Body */}
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-800 whitespace-pre-line text-justify">
          {novelContent}
        </div>

        <div className="text-center pt-8 border-t border-amber-900/20 text-xs text-amber-800 font-sans italic">
          — Akhir dari Cuplikan Bab Ini • Dihasilkan Otomatis oleh AetherMaster AI —
        </div>
      </div>
    </div>
  );
};
