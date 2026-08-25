import React from 'react';
import { Trophy, Award, Shield, Skull, Coins, Sparkles, Star } from 'lucide-react';

export const HallOfFame = ({ characters = [] }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-fantasy-gold flex items-center justify-center text-2xl shadow-gold-glow">
            🏆
          </div>
          <div>
            <h2 className="font-cinzel text-fantasy-gold text-xl font-bold flex items-center gap-2">
              Aula Pahlawan & Memorial Legenda (Hall of Fame)
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Mengabadikan pencapaian pahlawan terhebat, monster yang dikalahkan, dan peninggalan pusaka
            </p>
          </div>
        </div>
      </div>

      {/* Hall of Fame Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {characters.map((char, index) => (
          <div
            key={char.id || index}
            className="glass-card rounded-2xl p-6 border border-fantasy-border hover:border-fantasy-gold/60 transition-all flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden group"
          >
            {/* Crown Ribbon for Highest Level */}
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-300 text-slate-950 font-cinzel font-black text-[10px] uppercase px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                <Star size={11} fill="currentColor" /> Pahlawan Tertinggi
              </div>
            )}

            <div className="flex items-center gap-4">
              <img
                src={char.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${char.name}`}
                alt={char.name}
                className="w-16 h-16 rounded-2xl border-2 border-fantasy-gold bg-slate-900 object-cover shadow-md"
              />
              <div>
                <h3 className="font-cinzel text-fantasy-gold text-lg font-bold group-hover:text-amber-300 transition-colors">
                  {char.name}
                </h3>
                <div className="text-xs text-slate-300">
                  Tingkat {char.level} {char.race} {char.characterClass}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {char.background} • {char.alignment}
                </div>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
              <div>
                <div className="text-[9px] text-slate-400 uppercase">HP Darah</div>
                <div className="text-sm font-black font-cinzel text-emerald-400 mt-0.5">
                  {char.currentHp}/{char.maxHp}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Armor (AC)</div>
                <div className="text-sm font-black font-cinzel text-sky-300 mt-0.5">
                  {char.armorClass || 12}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Koin Emas</div>
                <div className="text-sm font-black font-cinzel text-amber-300 mt-0.5">
                  {char.gold || 0} GP
                </div>
              </div>
            </div>

            {/* Achievements Badges */}
            <div className="space-y-1.5 text-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Pencapaian Epik:</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-700/60 flex items-center gap-1">
                  ⚔️ Penjelajah Dungeon
                </span>
                <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-700/60 flex items-center gap-1">
                  ✨ Penguasa Sihir
                </span>
                {char.level >= 2 && (
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1">
                    🏆 Veteran Tempur
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
