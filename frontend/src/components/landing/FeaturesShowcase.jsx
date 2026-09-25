import React from 'react';
import { GitFork, Backpack, Volume2, Shield, Sparkles, Dices } from 'lucide-react';

export default function FeaturesShowcase() {
  const features = [
    {
      icon: <GitFork className="w-6 h-6 text-cyan-400" />,
      title: 'Pohon Narasi Bercabang & Rewind',
      desc: 'Setiap keputusan mencabangkan alur cerita. Pemain dapat membuka Story Tree modal dan melakukan kilas balik (rewind) ke titik persimpangan sebelumnya.',
      badge: 'Branching DAG'
    },
    {
      icon: <Dices className="w-6 h-6 text-amber-400" />,
      title: 'Lemparan Dadu D20 3D Fisika',
      desc: 'Visualisasi lemparan dadu icosahedron 3D Three.js dengan audit D&D 5E server-authoritative lengkap: Ability Check, DC, Modifier, dan Critical Success/Failure.',
      badge: 'Three.js & 5E'
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
      desc: '100% audio lokal tanpa aset berat menggunakan Web Audio API: denting lemparan dadu, benturan pedang, detak jantung saat HP kritis, dan soundscape suasana.',
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
            Kombinasi aturan D&amp;D 5E klasik dengan kenyamanan visual novel interaktif dan feedback audiovisual imersif.
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
