import React from 'react';
import { GitFork, Backpack, Volume2, Sparkles, BookOpen } from 'lucide-react';

export default function FeaturesShowcase() {
  const features = [
    {
      icon: <GitFork className="w-6 h-6 text-cyan-400" />,
      title: 'Pohon Narasi Bercabang & Rewind',
      desc: 'Setiap keputusan mencabangkan alur cerita. Pemain dapat membuka Story Tree modal dan melakukan kilas balik (rewind) ke titik persimpangan sebelumnya.',
      badge: 'Branching DAG'
    },
    {
      icon: <BookOpen className="w-6 h-6 text-amber-400" />,
      title: 'Kecerdasan Narasi Interaktif DM',
      desc: 'Narasi mendalam dan dinamis bertenaga AI yang merespons setiap aksi dan keputusan pemain secara kontekstual dan mengalir alami.',
      badge: 'Visual Novel AI'
    },
    {
      icon: <Backpack className="w-6 h-6 text-emerald-400" />,
      title: 'Tas Petualang 6-Slot Cerdas',
      desc: 'Sistem inventaris terintegrasi dengan pemulihan status instan untuk ramuan, senjata berkekuatan magis, dan item pembuka kunci jalur pilihan tersembunyi.',
      badge: 'Tactical Gear'
    },
    {
      icon: <Volume2 className="w-6 h-6 text-purple-400" />,
      title: 'Sintesis Audio & Heartbeat Reaktif',
      desc: '100% audio lokal tanpa aset berat menggunakan Web Audio API: efek benturan pedang, kilatan sihir, detak jantung saat HP kritis, dan soundscape suasana.',
      badge: 'Web Audio API'
    }
  ];

  return (
    <section className="relative z-20 w-full py-16 px-6 md:px-12 bg-slate-900/50 border-t border-slate-800/80">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase font-semibold tracking-widest text-amber-400 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Pilar Mekanik Permainan
          </span>
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white tracking-tight">
            Arsitektur Virtual Tabletop Modern
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-light leading-relaxed">
            Kenyamanan visual novel RPG interaktif dengan kebebasan bermain peran dan feedback audiovisual imersif.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 transition-all flex flex-col justify-between gap-4 shadow-lg group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                  {feat.icon}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-cinzel text-sm font-bold text-white tracking-wide">
                    {feat.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-850">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                  {feat.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
